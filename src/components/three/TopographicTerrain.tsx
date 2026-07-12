"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import {
  GRID_SIZE, WORLD_SIZE, TERRAIN_HEIGHT,
  sampleH, sampleGrid, toWorld,
  CHECKPOINTS, elevationColor, hash2,
} from "./terrain-utils";

// ─────────────────────────────────────────────────────────────────────────────
// Light direction (matching the reference)
// ─────────────────────────────────────────────────────────────────────────────
const LIGHT_AZ = 315 * Math.PI / 180;
const LIGHT_EL = 25 * Math.PI / 180;
const LIGHT_X = Math.cos(LIGHT_EL) * Math.cos(LIGHT_AZ);
const LIGHT_Y = -Math.sin(LIGHT_EL);
const LIGHT_Z = Math.cos(LIGHT_EL) * Math.sin(LIGHT_AZ);
const LIGHT_LEN = Math.sqrt(LIGHT_X * LIGHT_X + LIGHT_Y * LIGHT_Y + LIGHT_Z * LIGHT_Z);
const LSX = -LIGHT_X / LIGHT_LEN;
const LSY = -LIGHT_Y / LIGHT_LEN;
const LSZ = -LIGHT_Z / LIGHT_LEN;

// ─────────────────────────────────────────────────────────────────────────────
// Terrain mesh — vertex-color baked shading (hillshade + slope + texture + AO)
// Matches the reference index.html terrain rendering exactly.
// ─────────────────────────────────────────────────────────────────────────────

function TerrainMesh() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    const positions = g.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const eps = 1 / (GRID_SIZE - 1);
    const heightScale = TERRAIN_HEIGHT / WORLD_SIZE;

    for (let i = 0; i < positions.count; i++) {
      const ix = i % GRID_SIZE;
      const iy = Math.floor(i / GRID_SIZE);
      const h = sampleGrid(ix, iy);
      positions.setZ(i, h * TERRAIN_HEIGHT);

      const nx = ix / (GRID_SIZE - 1);
      const ny = iy / (GRID_SIZE - 1);
      const hL = sampleH(Math.max(0, nx - eps), ny);
      const hR = sampleH(Math.min(1, nx + eps), ny);
      const hD = sampleH(nx, Math.max(0, ny - eps));
      const hU = sampleH(nx, Math.min(1, ny + eps));
      const dhdx = ((hR - hL) / (2 * eps)) * heightScale;
      const dhdz = ((hU - hD) / (2 * eps)) * heightScale;
      const nLen = Math.sqrt(dhdx * dhdx + 1 + dhdz * dhdz);
      const nxn = -dhdx / nLen;
      const nyn = 1 / nLen;
      const nzn = -dhdz / nLen;

      let hillshade = nxn * LSX + nyn * LSY + nzn * LSZ;
      hillshade = Math.max(0, hillshade);
      const shade = 0.25 + 0.75 * hillshade;

      const slope = Math.sqrt(dhdx * dhdx + dhdz * dhdz);
      const slopeFactor = 1.0 - Math.min(0.25, slope * 0.12);

      const texFreq = 25.0;
      const texNoise = (hash2(nx * texFreq + 0.3, ny * texFreq - 0.7) - 0.5) * 2.0;
      const texNoise2 = (hash2(nx * texFreq * 2.1 + 1.1, ny * texFreq * 2.1 - 0.4) - 0.5) * 2.0;
      const slopeMod = 1.0 + Math.min(1.0, slope * 0.3);
      const textureMod = (texNoise * 0.6 + texNoise2 * 0.4) * 0.04 * slopeMod;

      let finalShade = shade * slopeFactor + textureMod;

      // Valley ambient occlusion
      if (h < 0.35) {
        const neighborAvg = (hL + hR + hD + hU) / 4;
        const concavity = Math.max(0, neighborAvg - h);
        const depthFactor = 1.0 - h / 0.35;
        const aoDarken = Math.min(0.38, concavity * 3.0 * depthFactor);
        finalShade *= 1.0 - aoDarken;
      }

      const [r, gg, b] = elevationColor(h);
      colors[i * 3] = Math.max(0, r * finalShade);
      colors[i * 3 + 1] = Math.max(0, gg * finalShade);
      colors[i * 3 + 2] = Math.max(0, b * finalShade);
    }

    positions.needsUpdate = true;
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Contour lines — hierarchical, LineSegments, cyan with major/minor opacity
// ─────────────────────────────────────────────────────────────────────────────

const NUM_CONTOURS = 22;
const CONTOUR_STEP_CELLS = 5;

function ContourLines() {
  const segments = useMemo(() => {
    const majorPoints: THREE.Vector3[] = [];
    const minorPoints: THREE.Vector3[] = [];

    for (let c = 0; c < NUM_CONTOURS; c++) {
      const level = (c + 1) / (NUM_CONTOURS + 1);
      const isMajor = (c + 1) % 5 === 0;
      const segPoints: THREE.Vector3[] = [];

      for (let iy = 0; iy < GRID_SIZE - CONTOUR_STEP_CELLS; iy += CONTOUR_STEP_CELLS) {
        for (let ix = 0; ix < GRID_SIZE - CONTOUR_STEP_CELLS; ix += CONTOUR_STEP_CELLS) {
          const h00 = sampleGrid(ix, iy);
          const h10 = sampleGrid(ix + CONTOUR_STEP_CELLS, iy);
          const h01 = sampleGrid(ix, iy + CONTOUR_STEP_CELLS);
          const h11 = sampleGrid(ix + CONTOUR_STEP_CELLS, iy + CONTOUR_STEP_CELLS);
          const n00 = [ix / (GRID_SIZE - 1), iy / (GRID_SIZE - 1)];
          const n10 = [(ix + CONTOUR_STEP_CELLS) / (GRID_SIZE - 1), iy / (GRID_SIZE - 1)];
          const n01 = [ix / (GRID_SIZE - 1), (iy + CONTOUR_STEP_CELLS) / (GRID_SIZE - 1)];
          const n11 = [(ix + CONTOUR_STEP_CELLS) / (GRID_SIZE - 1), (iy + CONTOUR_STEP_CELLS) / (GRID_SIZE - 1)];

          const edges = [
            [n00[0], n00[1], h00, n10[0], n10[1], h10],
            [n10[0], n10[1], h10, n11[0], n11[1], h11],
            [n11[0], n11[1], h11, n01[0], n01[1], h01],
            [n01[0], n01[1], h01, n00[0], n00[1], h00],
          ];

          const crossings: THREE.Vector3[] = [];
          for (const [ax, ay, ah, bx, by, bh] of edges) {
            const minH = Math.min(ah, bh);
            const maxH = Math.max(ah, bh);
            if (level >= minH && level <= maxH && maxH > minH) {
              const t = (level - ah) / (bh - ah);
              const cnx = ax + (bx - ax) * t;
              const cny = ay + (by - ay) * t;
              const [wx, wy, wz] = toWorld(cnx, cny, level);
              crossings.push(new THREE.Vector3(wx, wy + 0.02, wz));
            }
          }

          if (crossings.length === 2) {
            segPoints.push(crossings[0], crossings[1]);
          } else if (crossings.length === 4) {
            segPoints.push(crossings[0], crossings[1], crossings[2], crossings[3]);
          }
        }
      }

      if (isMajor) majorPoints.push(...segPoints);
      else minorPoints.push(...segPoints);
    }

    return { majorPoints, minorPoints };
  }, []);

  const majorGeo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(segments.majorPoints);
    return g;
  }, [segments]);

  const minorGeo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(segments.minorPoints);
    return g;
  }, [segments]);

  return (
    <group>
      <lineSegments geometry={majorGeo}>
        <lineBasicMaterial color={0x38c0e0} transparent opacity={0.35} />
      </lineSegments>
      <lineSegments geometry={minorGeo}>
        <lineBasicMaterial color={0x38c0e0} transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashed trail connecting checkpoints (Line2 thick dashed)
// ─────────────────────────────────────────────────────────────────────────────

function DashedTrail() {
  const { size } = useThree();
  const lineObj = useMemo(() => {
    const flatPoints: number[] = [];
    for (let i = 0; i < CHECKPOINTS.length; i++) {
      const cp = CHECKPOINTS[i];
      const [x, y, z] = toWorld(cp.nx, cp.ny, sampleH(cp.nx, cp.ny));
      flatPoints.push(x, y + 0.15, z);
      if (i < CHECKPOINTS.length - 1) {
        const a = CHECKPOINTS[i];
        const b = CHECKPOINTS[i + 1];
        for (let s = 1; s < 24; s++) {
          const t = s / 24;
          const nx = a.nx + (b.nx - a.nx) * t;
          const ny = a.ny + (b.ny - a.ny) * t;
          const [wx, wy, wz] = toWorld(nx, ny, sampleH(nx, ny));
          flatPoints.push(wx, wy + 0.15, wz);
        }
      }
    }
    const geo = new LineGeometry();
    geo.setPositions(flatPoints);
    const mat = new LineMaterial({
      color: 0x38c0e0,
      linewidth: 4,
      dashed: true,
      dashSize: 0.6,
      gapSize: 0.35,
      transparent: true,
      opacity: 0.85,
    });
    mat.resolution.set(size.width, size.height);
    const line = new Line2(geo, mat);
    line.computeLineDistances();
    return line;
  }, [size.width, size.height]);

  return <primitive object={lineObj} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkpoint flags — matching the reference style
// ─────────────────────────────────────────────────────────────────────────────

function CheckpointFlags({ activeCheckpoint, onSelect }: { activeCheckpoint: number | null; onSelect: (i: number) => void }) {
  const flagRefs = useRef<(THREE.Mesh | null)[]>([]);
  const beaconRefs = useRef<(THREE.PointLight | null)[]>([]);

  // Create number sprites once — safe because this only runs inside <Canvas>
  // which is client-only (R3F's Canvas component guards against SSR).
  const sprites = useMemo(() => {
    return CHECKPOINTS.map((_, i) => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      ctx.font = "bold 80px Georgia,serif";
      ctx.fillStyle = "#ffb3d9";
      ctx.strokeStyle = "#06070a";
      ctx.lineWidth = 6;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText(`${i + 1}`, 64, 64);
      ctx.fillText(`${i + 1}`, 64, 64);
      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sprite.scale.set(0.65, 0.65, 0.65);
      return sprite;
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    flagRefs.current.forEach((flag, i) => {
      if (flag) flag.rotation.z = Math.sin(t * 3 + i) * 0.15;
    });
    beaconRefs.current.forEach((light, i) => {
      if (light) {
        const isActive = i === activeCheckpoint;
        light.intensity = (isActive ? 0.9 : 0.5) + 0.2 * Math.sin(t * 1.8 + i * 1.3);
      }
    });
  });

  return (
    <group>
      {CHECKPOINTS.map((cp, i) => {
        const h = sampleH(cp.nx, cp.ny);
        const [x, y, z] = toWorld(cp.nx, cp.ny, h);
        return (
          <group key={cp.id} position={[x, y, z]} onClick={(e) => { e.stopPropagation(); onSelect(i); }}>
            {/* Pole */}
            <mesh position={[0, 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.035, 1.6, 8]} />
              <meshStandardMaterial color={0x1a2535} roughness={0.5} metalness={0.6} />
            </mesh>
            {/* Finial */}
            <mesh position={[0, 1.55, 0]} castShadow>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshStandardMaterial color={0xffd700} emissive={0xffd700} emissiveIntensity={0.5} roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Flag */}
            <mesh ref={(el) => { flagRefs.current[i] = el; }} position={[0.32, 1.3, 0]} castShadow>
              <boxGeometry args={[0.7, 0.45, 0.015]} />
              <meshStandardMaterial color={0xffb3d9} emissive={0xffb3d9} emissiveIntensity={0.5} roughness={0.4} metalness={0.1} side={THREE.DoubleSide} />
            </mesh>
            {/* Stripes */}
            <mesh position={[0.32, 1.45, 0.01]}>
              <boxGeometry args={[0.7, 0.04, 0.01]} />
              <meshStandardMaterial color={0xff8fbf} emissive={0xff8fbf} emissiveIntensity={0.4} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0.32, 1.15, 0.01]}>
              <boxGeometry args={[0.7, 0.04, 0.01]} />
              <meshStandardMaterial color={0xff8fbf} emissive={0xff8fbf} emissiveIntensity={0.4} side={THREE.DoubleSide} />
            </mesh>
            {/* Beacon */}
            <mesh position={[0, 1.58, 0]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshStandardMaterial color={0xff8fbf} emissive={0xff8fbf} emissiveIntensity={1.5} />
            </mesh>
            {/* Number sprite */}
            <primitive object={sprites[i]} position={[0, 1.95, 0]} />
            {/* Point light */}
            <pointLight ref={(el) => { beaconRefs.current[i] = el; }} position={[0, 1.58, 0]} color={0xffb3d9} intensity={0.6} distance={7} />
            {/* Click sphere */}
            <mesh position={[0, 1.0, 0]}>
              <sphereGeometry args={[0.5, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera rig — eased fly-to with elevation-aware positioning
// ─────────────────────────────────────────────────────────────────────────────

function CameraRig({
  activeCheckpoint, isFlying, resetCamera, onFlyComplete,
}: {
  activeCheckpoint: number | null;
  isFlying: boolean;
  resetCamera: number;
  onFlyComplete: () => void;
}) {
  const { camera } = useThree();
  const flyStart = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const flyEnd = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const flyProgress = useRef(0);
  const prevReset = useRef(0);
  const cameraTarget = useRef(new THREE.Vector3(0, 3, 0));

  useEffect(() => {
    if (isFlying && activeCheckpoint !== null) {
      const cp = CHECKPOINTS[activeCheckpoint];
      const h = sampleH(cp.nx, cp.ny);
      const [tx, ty, tz] = toWorld(cp.nx, cp.ny, h);
      const nextIdx = (activeCheckpoint + 1) % CHECKPOINTS.length;
      const nextCp = CHECKPOINTS[nextIdx];
      const [nx, ny, nz] = toWorld(nextCp.nx, nextCp.ny, sampleH(nextCp.nx, nextCp.ny));
      const dirX = nx - tx, dirZ = nz - tz;
      const dirLen = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
      // Per-checkpoint zoom distance — checkpoint 1 (index 0) is zoomed out 15%.
      const zoomDist = activeCheckpoint === 0 ? 6.7 : 12;
      const elevationDiff = ny - ty;
      let cameraY: number;
      if (elevationDiff > 0.5) {
        if (elevationDiff > 4.0) cameraY = ty + 3.0;
        else cameraY = ty + 3.0 + elevationDiff * 1.5;
      } else {
        cameraY = ty + 7.5;
      }
      // For checkpoint 1, angle the camera target toward checkpoint 2 so both
      // are visible in frame while keeping checkpoint 1 centered-close.
      const blend = activeCheckpoint === 0 ? 0.35 : 0.1;
      let targetY: number;
      if (elevationDiff > 0.5) targetY = ty + elevationDiff * 0.3 + 0.5;
      else targetY = ty + 0.5;
      flyStart.current = { pos: camera.position.clone(), target: cameraTarget.current.clone() };
      flyEnd.current = {
        pos: new THREE.Vector3(tx - (dirX / dirLen) * zoomDist, cameraY, tz - (dirZ / dirLen) * zoomDist),
        target: new THREE.Vector3(tx + (nx - tx) * blend, targetY, tz + (nz - tz) * blend),
      };
      flyProgress.current = 0;
    }
    if (resetCamera !== prevReset.current) {
      prevReset.current = resetCamera;
      flyStart.current = { pos: camera.position.clone(), target: cameraTarget.current.clone() };
      flyEnd.current = { pos: new THREE.Vector3(36, 30, 36), target: new THREE.Vector3(0, 3, 0) };
      flyProgress.current = 0;
    }
  }, [activeCheckpoint, isFlying, resetCamera, camera]);

  useFrame((_, delta) => {
    if (flyStart.current && flyEnd.current && flyProgress.current < 1) {
      flyProgress.current = Math.min(1, flyProgress.current + delta * 1.2);
      const t = flyProgress.current;
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      camera.position.lerpVectors(flyStart.current.pos, flyEnd.current.pos, eased);
      cameraTarget.current.lerpVectors(flyStart.current.target, flyEnd.current.target, eased);
      camera.lookAt(cameraTarget.current);
      if (flyProgress.current >= 1) {
        flyStart.current = null;
        flyEnd.current = null;
        onFlyComplete();
      }
    }
  });

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function TopographicTerrain({
  activeCheckpoint, isFlying, resetCamera, onSelectCheckpoint, onFlyComplete,
}: {
  activeCheckpoint: number | null;
  isFlying: boolean;
  resetCamera: number;
  onSelectCheckpoint: (i: number) => void;
  onFlyComplete: () => void;
}) {
  return (
    <group>
      <TerrainMesh />
      <ContourLines />
      <DashedTrail />
      <CheckpointFlags activeCheckpoint={activeCheckpoint} onSelect={onSelectCheckpoint} />
      <CameraRig
        activeCheckpoint={activeCheckpoint}
        isFlying={isFlying}
        resetCamera={resetCamera}
        onFlyComplete={onFlyComplete}
      />
    </group>
  );
}
