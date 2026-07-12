"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { TopographicTerrain } from "@/components/three/TopographicTerrain";
import { SceneMediaViewer } from "@/components/three/SceneMediaViewer";
import { CHECKPOINTS, sampleH, toWorld } from "@/components/three/terrain-utils";

export default function Page() {
  const [activeCheckpoint, setActiveCheckpoint] = useState<number | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  const [showScene, setShowScene] = useState(false);
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [autoRotate, setAutoRotate] = useState(true);
  const [resetCamera, setResetCamera] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const activeCheckpointRef = useRef<number | null>(null);
  const isFlyingRef = useRef(false);
  const lastInteractionRef = useRef(Date.now());
  const autoRotateRef = useRef(true);

  useEffect(() => {
    const onInteract = () => {
      lastInteractionRef.current = Date.now();
      if (autoRotateRef.current) { autoRotateRef.current = false; setAutoRotate(false); }
    };
    window.addEventListener("mousedown", onInteract);
    window.addEventListener("wheel", onInteract);
    window.addEventListener("touchstart", onInteract);
    return () => {
      window.removeEventListener("mousedown", onInteract);
      window.removeEventListener("wheel", onInteract);
      window.removeEventListener("touchstart", onInteract);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const idle = Date.now() - lastInteractionRef.current > 4000;
      if (idle && !autoRotateRef.current && !isFlyingRef.current && !showScene) {
        autoRotateRef.current = true; setAutoRotate(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [showScene]);

  const handleSelect = useCallback((idx: number) => {
    if (isFlyingRef.current) return;
    setVisited((prev) => new Set(prev).add(idx));
    autoRotateRef.current = false; setAutoRotate(false);
    lastInteractionRef.current = Date.now();
    if (activeCheckpointRef.current === idx) {
      // Reopening the same checkpoint — just open the scene without
      // closing first, which avoids a tear-down/rebuild flash of the
      // SceneMediaViewer Canvas.
      setShowScene(true);
    } else {
      // Flying to a new checkpoint — close any open scene first so the
      // old diorama unmounts cleanly before the new one mounts on arrival.
      setShowScene(false);
      setActiveCheckpoint(idx); activeCheckpointRef.current = idx;
      setIsFlying(true); isFlyingRef.current = true;
    }
  }, []);

  const handleFlyComplete = useCallback(() => {
    setIsFlying(false); isFlyingRef.current = false;
    // Don't set autoRotate=true here — the scene panel is about to open
    // and auto-rotating the (hidden) main terrain would compete with the
    // SceneMediaViewer Canvas mount for GPU time, causing a visible stutter.
    // The idle timer will start auto-rotate after the scene closes.
    setShowScene(true);
  }, []);

  const handleEscape = useCallback(() => {
    if (showScene) {
      setShowScene(false);
      // Start auto-rotate immediately when the scene closes so the camera
      // resumes orbiting without waiting for the idle timer. This also
      // masks the slight OrbitControls target shift (orbit target has no
      // blend offset, unlike the fly-to target).
      autoRotateRef.current = true; setAutoRotate(true);
    } else {
      setActiveCheckpoint(null); activeCheckpointRef.current = null;
      setIsFlying(true); isFlyingRef.current = true; setShowScene(false);
      setResetCamera((n) => n + 1);
    }
  }, [showScene]);

  const handleClose = useCallback(() => {
    setShowScene(false);
    autoRotateRef.current = true; setAutoRotate(true);
  }, []);

  const handlePrev = useCallback(() => {
    if (activeCheckpointRef.current === null) { handleSelect(0); return; }
    const prev = Math.max(0, activeCheckpointRef.current - 1);
    if (prev !== activeCheckpointRef.current) handleSelect(prev);
  }, [handleSelect]);

  const handleNext = useCallback(() => {
    if (activeCheckpointRef.current === null) { handleSelect(0); return; }
    const next = Math.min(CHECKPOINTS.length - 1, activeCheckpointRef.current + 1);
    if (next !== activeCheckpointRef.current) handleSelect(next);
  }, [handleSelect]);

  const handleOpenScene = useCallback(() => {
    if (isFlyingRef.current) return;
    if (activeCheckpointRef.current === null) { handleSelect(0); return; }
    if (!showScene) setShowScene(true);
  }, [handleSelect, showScene]);

  const handleCloseScene = useCallback(() => {
    if (isFlyingRef.current) return;
    if (showScene) {
      setShowScene(false);
      autoRotateRef.current = true; setAutoRotate(true);
    }
  }, [showScene]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key;
      if (key === "Escape") {
        if (showHelp) { setShowHelp(false); return; }
        handleEscape();
      }
      if (key === "ArrowLeft" || key === "a" || key === "A") handlePrev();
      if (key === "ArrowRight" || key === "d" || key === "D") handleNext();
      if (key === " " || key === "Spacebar" || key === "ArrowUp" || key === "w" || key === "W") {
        e.preventDefault();
        if (!showHelp) handleOpenScene();
      }
      if (key === "ArrowDown" || key === "s" || key === "S") {
        e.preventDefault();
        if (!showHelp) handleCloseScene();
      }
      if (key === "?" || (key === "/" && e.shiftKey)) {
        if (!showScene && !isFlyingRef.current) setShowHelp((v) => !v);
      }
      const num = parseInt(key);
      if (num >= 1 && num <= CHECKPOINTS.length) handleSelect(num - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleEscape, handleSelect, handlePrev, handleNext, handleOpenScene, handleCloseScene, showHelp, showScene]);

  const current = activeCheckpoint !== null ? CHECKPOINTS[activeCheckpoint] : null;

  // Compute OrbitControls target — follows the active checkpoint so closing
  // the scene panel keeps the camera pointed at the checkpoint instead of
  // jumping back to the intro position.
  const orbitTarget = useMemo(() => {
    if (activeCheckpoint !== null) {
      const cp = CHECKPOINTS[activeCheckpoint];
      const h = sampleH(cp.nx, cp.ny);
      const [x, y, z] = toWorld(cp.nx, cp.ny, h);
      return [x, y + 0.5, z] as [number, number, number];
    }
    return [0, 3, 0] as [number, number, number];
  }, [activeCheckpoint]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a1f2e] text-[#e8f4f8]">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0, powerPreference: "high-performance" }}
        camera={{ position: [36, 30, 36], fov: 40, near: 0.1, far: 200 }}
      >
        <color attach="background" args={["#1a1f2e"]} />
        <fog attach="fog" args={["#2a3040", 40, 120]} />
        <ambientLight intensity={0.4} color="#a8b4c8" />
        <directionalLight position={[12, 20, 10]} intensity={1.2} color="#f0e8d8" />
        <directionalLight position={[-10, 8, -8]} intensity={0.3} color="#6a7a98" />
        <TopographicTerrain activeCheckpoint={activeCheckpoint} isFlying={isFlying} resetCamera={resetCamera} onSelectCheckpoint={handleSelect} onFlyComplete={handleFlyComplete} />
        <OrbitControls enablePan enableDamping dampingFactor={0.08} minDistance={10} maxDistance={120} minPolarAngle={Math.PI / 8} maxPolarAngle={Math.PI / 2.1} target={orbitTarget} enabled={!isFlying} autoRotate={autoRotate} autoRotateSpeed={0.4} makeDefault />
      </Canvas>

      <header className={`absolute top-0 left-0 right-0 p-6 pointer-events-none transition-opacity duration-500 ${showScene || showHelp ? "opacity-0" : "opacity-100"}`}>
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-3 pointer-events-auto">
            <div className="w-2 h-2 rounded-full bg-[#38c0e0] animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#38c0e0] font-mono">An Interactive Journey · Topographic Timeline</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-2 text-white">The Journey</h1>
          <p className="text-sm md:text-base text-[#a8c4d4] max-w-xl leading-relaxed">Follow the dashed trail across 8 checkpoints.<br />Use arrow keys or WASD to navigate.</p>
        </div>
      </header>

      <nav className={`absolute bottom-0 left-0 right-0 p-6 pointer-events-none transition-opacity duration-500 ${showScene || showHelp ? "opacity-0" : "opacity-100"}`}>
        <div className="flex items-center justify-center gap-2 pointer-events-auto">
          <div className="flex gap-1.5 p-2 rounded-full bg-[#0f1626]/80 backdrop-blur-md border border-[#38c0e0]/30 shadow-lg">
            {CHECKPOINTS.map((cp, i) => (
              <button key={cp.id} onClick={() => handleSelect(i)}
                className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all ${activeCheckpoint === i ? "text-[#06070a] scale-110" : visited.has(i) ? "text-[#38c0e0] hover:bg-[#38c0e0]/15" : "text-[#3a4a5a] hover:bg-[#38c0e0]/10"}`}
                style={activeCheckpoint === i ? { background: cp.accent } : {}}
                title={`${i + 1}. ${cp.title} (${cp.theme})`}>{i + 1}</button>
            ))}
          </div>
        </div>
      </nav>

      {showScene && current && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#2a2520]/80 backdrop-blur-sm" onClick={handleClose} />
          <article className="relative rounded-2xl shadow-2xl overflow-hidden" style={{ width: "1300px", height: "780px", background: "linear-gradient(180deg, #2a2520 0%, #1f1c18 100%)", border: `1px solid ${current.accent}40` }}>
            <div className="h-1.5 w-full" style={{ background: current.accent }} />
            <button onClick={handleClose} className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: `${current.accent}20`, color: current.accent }} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>

            <div className="absolute inset-0 top-1.5">
              <SceneMediaViewer id={activeCheckpoint ?? 0} accent={current.accent} />
            </div>

            <div className="absolute top-0 left-0 right-0 pt-6 px-4 pointer-events-none z-20">
              <div className="text-center">
                <div className="inline-block px-12 py-5 rounded-lg" style={{
                  background: "linear-gradient(135deg, #b8d0dc 0%, #c8b0c8 100%)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)",
                  border: "1px solid rgba(160, 180, 200, 0.4)",
                }}>
                  <div className="text-[13px] font-serif font-bold tracking-[0.3em] uppercase mb-2 pl-[0.3em]" style={{ color: "#21355c" }}>Checkpoint {(activeCheckpoint ?? 0) + 1} / {CHECKPOINTS.length} · {current.theme}</div>
                  <h2 className="font-serif text-[42px] font-black tracking-tight leading-none mb-2" style={{ color: "#21355c" }}>{current.title}</h2>
                  <p className="text-[17px] italic font-serif font-semibold" style={{ color: "#2e4674" }}>{current.subtitle}</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto" style={{ background: "linear-gradient(180deg, rgba(31,28,24,0) 0%, rgba(31,28,24,0.15) 10%, rgba(31,28,24,0.35) 22%, rgba(31,28,24,0.55) 36%, rgba(31,28,24,0.72) 50%, rgba(31,28,24,0.85) 65%, rgba(31,28,24,0.93) 82%, rgba(29,25,21,0.97) 100%)", minHeight: "280px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <div className="px-20 pb-6 pt-24">
                <p className="text-center text-[15px] leading-[1.6] text-[#f0e8e0] max-w-[780px] mx-auto mb-6">{current.description}</p>
                <div className="mb-5 max-w-2xl mx-auto">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#38c0e0] mb-2.5 text-center">Journey Timeline</div>
                  <div className="flex items-center gap-1.5">
                    {CHECKPOINTS.map((cp, i) => (
                      <button key={cp.id} onClick={() => i !== activeCheckpoint && handleSelect(i)} className="flex-1 group" title={cp.title}>
                        <div className="h-1.5 rounded-full transition-all" style={{ background: i === activeCheckpoint ? current.accent : visited.has(i) ? `${cp.accent}80` : "#2a3040" }} />
                        <div className="text-[10px] font-mono mt-1.5 text-center transition-colors" style={{ color: i === activeCheckpoint ? current.accent : visited.has(i) ? cp.accent : "#3a4a5a" }}>{i + 1}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <footer className="flex items-center justify-center">
                  <button onClick={handleClose} className="px-7 py-2.5 rounded-lg text-sm font-medium transition hover:scale-105" style={{ background: current.accent, color: "#06070a" }}>Back to Map</button>
                </footer>
              </div>
            </div>
          </article>
        </div>
      )}

      {!showScene && (
        <button onClick={() => setShowHelp((v) => !v)} className="absolute bottom-6 right-6 w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold font-mono bg-[#0f1626]/80 backdrop-blur-md border border-[#38c0e0]/40 text-[#38c0e0] hover:bg-[#38c0e0]/15 hover:scale-110 transition-all shadow-lg z-40" aria-label="Show keyboard shortcuts" title="Keyboard shortcuts (?)">?</button>
      )}

      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-[#2a2520]/70 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
          <div className="relative max-w-md w-full rounded-2xl shadow-2xl overflow-hidden" style={{ background: "linear-gradient(180deg, #2a2520 0%, #1f1c18 100%)", border: "1px solid #38c0e040" }}>
            <div className="h-1.5 w-full bg-[#38c0e0]" />
            <button onClick={() => setShowHelp(false)} className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: "#38c0e020", color: "#38c0e0" }} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <div className="px-6 md:px-8 py-8">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#38c0e0] mb-2">Quick Reference</div>
              <h2 className="font-serif text-2xl font-bold tracking-tight mb-5 text-white">Keyboard & Mouse</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3"><kbd className="shrink-0 px-2 py-0.5 rounded bg-[#1a2540] border border-[#38c0e0]/30 text-[#38c0e0] font-mono text-xs">Click</kbd><span className="text-[#a8c4d4]">Click a numbered button or a flag on the map to fly to that checkpoint.</span></li>
                <li className="flex items-start gap-3"><kbd className="shrink-0 px-2 py-0.5 rounded bg-[#1a2540] border border-[#38c0e0]/30 text-[#38c0e0] font-mono text-xs">Drag</kbd><span className="text-[#a8c4d4]">Drag the map to orbit around the terrain.</span></li>
                <li className="flex items-start gap-3"><kbd className="shrink-0 px-2 py-0.5 rounded bg-[#1a2540] border border-[#38c0e0]/30 text-[#38c0e0] font-mono text-xs">Scroll</kbd><span className="text-[#a8c4d4]">Scroll to zoom in and out.</span></li>
                <li className="flex items-start gap-3"><kbd className="shrink-0 px-2 py-0.5 rounded bg-[#1a2540] border border-[#38c0e0]/30 text-[#38c0e0] font-mono text-xs">1–8</kbd><span className="text-[#a8c4d4]">Jump straight to checkpoint N.</span></li>
                <li className="flex items-start gap-3"><kbd className="shrink-0 px-2 py-0.5 rounded bg-[#1a2540] border border-[#38c0e0]/30 text-[#38c0e0] font-mono text-xs">← → / A D</kbd><span className="text-[#a8c4d4]">Navigate to the previous / next checkpoint.</span></li>
                <li className="flex items-start gap-3"><kbd className="shrink-0 px-2 py-0.5 rounded bg-[#1a2540] border border-[#38c0e0]/30 text-[#38c0e0] font-mono text-xs">Space / ↑ / W</kbd><span className="text-[#a8c4d4]">Open the selected checkpoint's chapter panel.</span></li>
                <li className="flex items-start gap-3"><kbd className="shrink-0 px-2 py-0.5 rounded bg-[#1a2540] border border-[#38c0e0]/30 text-[#38c0e0] font-mono text-xs">↓ / S</kbd><span className="text-[#a8c4d4]">Close the chapter panel.</span></li>
                <li className="flex items-start gap-3"><kbd className="shrink-0 px-2 py-0.5 rounded bg-[#1a2540] border border-[#38c0e0]/30 text-[#38c0e0] font-mono text-xs">?</kbd><span className="text-[#a8c4d4]">Toggle this help window.</span></li>
                <li className="flex items-start gap-3"><kbd className="shrink-0 px-2 py-0.5 rounded bg-[#1a2540] border border-[#38c0e0]/30 text-[#38c0e0] font-mono text-xs">Esc</kbd><span className="text-[#a8c4d4]">Close the chapter panel, or reset the camera to the intro view.</span></li>
              </ul>
              <footer className="flex items-center justify-center pt-6 mt-6 border-t border-[#1a2540]">
                <button onClick={() => setShowHelp(false)} className="px-6 py-2.5 rounded-lg text-sm font-medium transition hover:scale-105" style={{ background: "#38c0e0", color: "#06070a" }}>Got it</button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
