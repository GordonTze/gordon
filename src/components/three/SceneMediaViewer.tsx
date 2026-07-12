"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef, useMemo } from "react";
import * as THREE from "three";
import { CheckpointDiorama } from "./CheckpointDiorama";

// ─────────────────────────────────────────────────────────────────────────────
// SceneMediaViewer — mini R3F Canvas with auto-orbiting camera.
// Studio cyclorama background with pastel gradient + atmospheric fog.
// ─────────────────────────────────────────────────────────────────────────────

const CAMERA_CONFIG: { focus: [number, number, number]; radius: number; height: number; groundColor: string }[] = [
  { focus: [0, 0.5, 0.6], radius: 14.0, height: 6.0, groundColor: "#c8d8b8" },  // Genesis
  { focus: [0, 0.4, 0], radius: 9.0, height: 5.0, groundColor: "#c0e0d0" },      // Discovery
  { focus: [0, 0.35, 0], radius: 9.0, height: 5.0, groundColor: "#e0d0b8" },     // Challenge
  { focus: [0.2, 0.4, 0.1], radius: 9.0, height: 5.0, groundColor: "#c8d0d8" },  // Growth
  { focus: [0, 0.6, 0], radius: 9.0, height: 5.5, groundColor: "#e0d0e8" },      // Apex
  { focus: [0, 0.35, 0], radius: 9.0, height: 4.5, groundColor: "#d0d8e0" },     // Transition
  { focus: [0, 0.5, 0], radius: 9.0, height: 5.0, groundColor: "#d0e0c0" },      // Reinvention
  { focus: [0.2, 0.35, -0.2], radius: 9.0, height: 5.0, groundColor: "#c8e0e0" }, // Present
];

// ─── Studio cyclorama — large curved backdrop with gradient ──────────────────
// A half-cylinder that curves from the ground up, with a vertex-color gradient
// from warm peach at the bottom to soft atmospheric blue at the top.
function Cyclorama({ groundColor }: { groundColor: string }) {
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(80, 80, 60, 64, 1, true, 0, Math.PI);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    // Gradient colors
    const bottomColor = new THREE.Color("#8a7560"); // darker muted peach at horizon — easier on the eyes
    const topColor = new THREE.Color("#7a92a8");    // muted atmospheric blue at top
    const groundCol = new THREE.Color(groundColor);  // blend with ground at base

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // y ranges from -30 (bottom) to 30 (top)
      const t = (y + 30) / 60; // 0 at bottom, 1 at top

      if (t < 0.15) {
        // Blend ground color into peach at the very bottom
        const blend = t / 0.15;
        const r = groundCol.r * (1 - blend) + bottomColor.r * blend;
        const g2 = groundCol.g * (1 - blend) + bottomColor.g * blend;
        const b = groundCol.b * (1 - blend) + bottomColor.b * blend;
        colors[i * 3] = r;
        colors[i * 3 + 1] = g2;
        colors[i * 3 + 2] = b;
      } else {
        // Peach to blue gradient
        const t2 = (t - 0.15) / 0.85;
        colors[i * 3] = bottomColor.r + (topColor.r - bottomColor.r) * t2;
        colors[i * 3 + 1] = bottomColor.g + (topColor.g - bottomColor.g) * t2;
        colors[i * 3 + 2] = bottomColor.b + (topColor.b - bottomColor.b) * t2;
      }
    }

    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [groundColor]);

  return (
    <mesh geometry={geo} position={[0, 10, 0]}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} />
    </mesh>
  );
}

// ─── Volumetric mist planes — large transparent planes for depth ─────────────
function MistPlanes() {
  const mistRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (mistRef.current) {
      mistRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  const mistData = useMemo(() => [
    { pos: [0, 2, -30], scale: 50, opacity: 0.12 },
    { pos: [-20, 3, -25], scale: 40, opacity: 0.10 },
    { pos: [20, 1.5, -28], scale: 45, opacity: 0.11 },
    { pos: [0, 0.5, -35], scale: 60, opacity: 0.08 },
  ], []);

  return (
    <group ref={mistRef}>
      {mistData.map((m, i) => (
        <mesh key={i} position={m.pos as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]} scale={m.scale}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial color="#f0e8e0" transparent opacity={m.opacity} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function OrbitingCamera({ id }: { id: number }) {
  const { camera } = useThree();
  const t = useRef(0);
  const cfg = CAMERA_CONFIG[id] ?? CAMERA_CONFIG[0];
  useFrame((_, delta) => {
    t.current += delta * 0.22;
    const y = cfg.height + Math.sin(t.current * 0.4) * 0.25;
    camera.position.set(
      Math.cos(t.current) * cfg.radius + cfg.focus[0],
      y,
      Math.sin(t.current) * cfg.radius + cfg.focus[2]
    );
    camera.lookAt(cfg.focus[0], cfg.focus[1], cfg.focus[2]);
  });
  return null;
}

interface MediaViewerProps {
  id: number;
  accent: string;
}

export function SceneMediaViewer({ id, accent }: MediaViewerProps) {
  const cfg = CAMERA_CONFIG[id] ?? CAMERA_CONFIG[0];
  return (
    <Canvas
      shadows="percentage"
      camera={{ position: [cfg.radius, cfg.height, 0], fov: 45, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      dpr={[1, 2]}
    >
      {/* Background color matches the top of the cyclorama gradient */}
      <color attach="background" args={["#7a92a8"]} />

      {/* Heavy atmospheric fog — blurs distant terrain into thick muted mist (darkened for eye comfort) */}
      <fog attach="fog" args={["#8a7560", 15, 50]} />

      {/* Studio cyclorama — curved backdrop with peach-to-blue gradient */}
      <Cyclorama groundColor={cfg.groundColor} />

      {/* Volumetric mist planes for depth */}
      <MistPlanes />

      {/* Soft directional studio lighting — long diffused shadows */}
      <ambientLight intensity={0.5} color="#f5ede0" />
      <hemisphereLight args={["#f8f0e8", "#d5c5b0", 0.3]} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.6}
        color="#fff0d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      {/* Cool fill from opposite side for depth */}
      <directionalLight position={[-6, 5, -4]} intensity={0.3} color="#a0c0e0" />
      {/* Accent point light tinted to checkpoint color */}
      <pointLight position={[0, 2, 0]} intensity={0.3} color={accent} distance={12} />

      {/* Extended ground plane — below the diorama's GroundDisc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
        <circleGeometry args={[500, 64]} />
        <meshStandardMaterial color={cfg.groundColor} roughness={0.95} emissive={cfg.groundColor} emissiveIntensity={0.03} />
      </mesh>

      <Suspense fallback={null}>
        <CheckpointDiorama id={id} accent={accent} />
      </Suspense>
      <OrbitingCamera id={id} />
    </Canvas>
  );
}
