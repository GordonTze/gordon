"use client";

// =============================================================================
// CheckpointDiorama.tsx
// Eight hand-built "clay" dioramas — one per checkpoint (0..7).
// Each scene is a small stylised vignette rendered with React Three Fiber.
// The camera orbits the scene; the diorama group itself never self-rotates.
// =============================================================================

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// -----------------------------------------------------------------------------
// Shared types
// -----------------------------------------------------------------------------

type Vec3 = [number, number, number];

// -----------------------------------------------------------------------------
// Clay — the soft matte material that gives every object its "clay" look.
// Subtle emissive (same hue as the base colour) keeps shaded areas from
// going fully black, mimicking diffuse clay under soft studio light.
// -----------------------------------------------------------------------------
function Clay({
  color,
  roughness = 0.9,
  metalness = 0.1,
  emissiveIntensity = 0.08,
  flatShading = false,
  transparent = false,
  opacity = 1,
}: {
  color: string;
  roughness?: number;
  metalness?: number;
  emissiveIntensity?: number;
  flatShading?: boolean;
  transparent?: boolean;
  opacity?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={color}
      emissiveIntensity={emissiveIntensity}
      flatShading={flatShading}
      transparent={transparent}
      opacity={opacity}
    />
  );
}

// -----------------------------------------------------------------------------
// GroundDisc — a very large flat terrain cylinder. Radius 500 so the edge is
// never visible from any orbit angle. Each checkpoint passes its own pastel.
// -----------------------------------------------------------------------------
function GroundDisc({ color = "#c8d8b8" }: { color?: string }) {
  return (
    <mesh position={[0, -0.1, 0]} receiveShadow>
      <cylinderGeometry args={[500, 500, 0.2, 64]} />
      <Clay color={color} roughness={0.95} emissiveIntensity={0.03} />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Hill — a squashed sphere, the simplest stylised landform.
// -----------------------------------------------------------------------------
function Hill({
  position,
  scale = 1,
  color = "#8aaa7a",
}: {
  position: Vec3;
  scale?: number;
  color?: string;
}) {
  return (
    <mesh
      position={position}
      scale={[scale, scale * 0.5, scale]}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[1, 24, 16]} />
      <Clay color={color} />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Tree — trunk cylinder plus two stacked canopy spheres.
// -----------------------------------------------------------------------------
function Tree({
  position,
  scale = 1,
  color = "#6aa06a",
  rotation = [0, 0, 0],
}: {
  position: Vec3;
  scale?: number;
  color?: string;
  rotation?: Vec3;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.0, 8]} />
        <Clay color="#7a5a3a" />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.6, 16, 12]} />
        <Clay color={color} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.45, 16, 12]} />
        <Clay color={color} emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Bush — three clustered spheres low to the ground.
// -----------------------------------------------------------------------------
function Bush({
  position,
  scale = 1,
  color = "#6a9a5a",
}: {
  position: Vec3;
  scale?: number;
  color?: string;
}) {
  const blobs: { pos: Vec3; r: number }[] = useMemo(
    () => [
      { pos: [0, 0.2, 0], r: 0.35 },
      { pos: [0.3, 0.15, 0.1], r: 0.3 },
      { pos: [-0.25, 0.15, -0.05], r: 0.28 },
    ],
    []
  );
  return (
    <group position={position} scale={scale}>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.pos} castShadow receiveShadow>
          <sphereGeometry args={[b.r, 12, 8]} />
          <Clay color={color} />
        </mesh>
      ))}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Rock — a low dodecahedron, slightly squashed and rotated to break symmetry.
// -----------------------------------------------------------------------------
function Rock({
  position,
  scale = 1,
  color = "#a8a898",
  rotation = [0.2, 0.5, 0.1],
}: {
  position: Vec3;
  scale?: number;
  color?: string;
  rotation?: Vec3;
}) {
  return (
    <mesh
      position={position}
      scale={[scale, scale * 0.7, scale]}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <dodecahedronGeometry args={[0.4, 0]} />
      <Clay color={color} flatShading />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Paper — a flat box used for scattered blueprints / notes on the ground.
// -----------------------------------------------------------------------------
function Paper({
  position,
  rotation = [0, 0, 0],
  color = "#eef0e0",
  size = [0.8, 0.02, 1.0] as [number, number, number],
}: {
  position: Vec3;
  rotation?: Vec3;
  color?: string;
  size?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <Clay color={color} emissiveIntensity={0.05} />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Gear — cylinder body + box teeth around the rim, animated to spin on Z.
// Used in the Genesis workshop. The whole group rotates so all teeth follow.
// -----------------------------------------------------------------------------
function Gear({
  position,
  scale = 1,
  color = "#b8b8a8",
  speed = 1,
  rotation = [0, 0, 0],
}: {
  position: Vec3;
  scale?: number;
  color?: string;
  speed?: number;
  rotation?: Vec3;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed;
  });

  const teeth = useMemo(() => {
    const count = 8;
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2;
      return { x: Math.cos(a) * 0.45, y: Math.sin(a) * 0.45, rot: a };
    });
  }, []);

  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      {/* Body — cylinder oriented so its flat face points along Z (faces viewer) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.1, 24]} />
        <Clay color={color} />
      </mesh>
      {/* Teeth around the rim */}
      {teeth.map((t, i) => (
        <mesh
          key={i}
          position={[t.x, t.y, 0]}
          rotation={[0, 0, t.rot]}
          castShadow
        >
          <boxGeometry args={[0.16, 0.16, 0.1]} />
          <Clay color={color} />
        </mesh>
      ))}
      {/* Hub */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.14, 16]} />
        <Clay color="#6a6a5a" />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Cloud — cluster of transparent spheres that drifts horizontally on a sine.
// -----------------------------------------------------------------------------
function Cloud({
  position,
  scale = 1,
  color = "#ffffff",
  speed = 0.3,
  range = 8,
}: {
  position: Vec3;
  scale?: number;
  color?: string;
  speed?: number;
  range?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const baseX = position[0];
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.x = baseX + Math.sin(state.clock.elapsedTime * speed) * range;
    }
  });

  const puffs = useMemo(
    () => [
      { pos: [0, 0, 0] as Vec3, r: 0.6 },
      { pos: [0.7, 0.1, 0.2] as Vec3, r: 0.5 },
      { pos: [-0.6, 0, 0.1] as Vec3, r: 0.45 },
      { pos: [0.2, 0.3, -0.2] as Vec3, r: 0.4 },
    ],
    []
  );

  return (
    <group ref={ref} position={position} scale={scale}>
      {puffs.map((p, i) => (
        <mesh key={i} position={p.pos} castShadow>
          <sphereGeometry args={[p.r, 12, 10]} />
          <Clay
            color={color}
            transparent
            opacity={0.85}
            emissiveIntensity={0.06}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Bird — a small body with two flapping wings that circles in the air.
// The whole group orbits a centre point; wings flap on a faster sine.
// -----------------------------------------------------------------------------
function Bird({
  position,
  scale = 1,
  color = "#f0d0b0",
  speed = 0.4,
  radius = 3,
}: {
  position: Vec3;
  scale?: number;
  color?: string;
  speed?: number;
  radius?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    if (groupRef.current) {
      groupRef.current.position.x = position[0] + Math.cos(t) * radius;
      groupRef.current.position.z = position[2] + Math.sin(t) * radius;
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.3;
      // Face direction of travel
      groupRef.current.rotation.y = -t + Math.PI / 2;
    }
    const flap = Math.sin(state.clock.elapsedTime * 9) * 0.6;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Body — small sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.15, 10, 8]} />
        <Clay color={color} />
      </mesh>
      {/* Wings — thin boxes pivoting at the body centre */}
      <mesh ref={wingL} position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.5, 0.03, 0.18]} />
        <Clay color={color} />
      </mesh>
      <mesh ref={wingR} position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.5, 0.03, 0.18]} />
        <Clay color={color} />
      </mesh>
      {/* Beak — tiny cone pointing forward (-Z) */}
      <mesh position={[0, 0, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.04, 0.12, 6]} />
        <Clay color="#e0a050" />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Flag — pole with a cloth that flutters (rotates on Z via sine).
// The accent colour is used for the cloth to tie the scene together.
// -----------------------------------------------------------------------------
function Flag({
  position,
  clothColor = "#e88a8a",
  poleColor = "#7a5a3a",
  rotation = [0, 0, 0],
}: {
  position: Vec3;
  clothColor?: string;
  poleColor?: string;
  rotation?: Vec3;
}) {
  const clothRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (clothRef.current) {
      clothRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4) * 0.18;
    }
  });
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 2, 8]} />
        <Clay color={poleColor} />
      </mesh>
      <mesh position={[0, 2, 0]} castShadow>
        <sphereGeometry args={[0.06, 8, 8]} />
        <Clay color={poleColor} />
      </mesh>
      <mesh ref={clothRef} position={[0.4, 1.7, 0]} castShadow>
        <boxGeometry args={[0.6, 0.36, 0.02]} />
        <Clay color={clothColor} emissiveIntensity={0.14} />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Lantern — a pole topped by a glowing sphere whose emissive pulses.
// Used as a warm point of light in several checkpoints.
// -----------------------------------------------------------------------------
function Lantern({
  position,
  color = "#ffd070",
  scale = 1,
}: {
  position: Vec3;
  color?: string;
  scale?: number;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    const pulse = 0.55 + Math.sin(state.clock.elapsedTime * 2.2) * 0.3;
    if (matRef.current) matRef.current.emissiveIntensity = pulse;
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.8, 8]} />
        <Clay color="#4a4a4a" />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.08, 0.12, 8]} />
        <Clay color="#5a4a3a" />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.16, 14, 14]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <coneGeometry args={[0.14, 0.12, 8]} />
        <Clay color="#5a4a3a" />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// GlowingNode — a sphere that pulses in scale, used in the Discovery network.
// -----------------------------------------------------------------------------
function GlowingNode({
  position,
  color = "#a0d8ff",
  scale = 1,
}: {
  position: Vec3;
  color?: string;
  scale?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => position[0] * 1.7 + position[2] * 0.9, [position]);
  useFrame((state) => {
    const s = (1 + Math.sin(state.clock.elapsedTime * 2 + phase) * 0.18) * scale;
    if (ref.current) ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={position} castShadow>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.7}
        roughness={0.3}
      />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// NodeLine — a thin glowing line connecting two nodes, built from
// BufferGeometry + LineBasicMaterial (no canvas textures needed).
// -----------------------------------------------------------------------------
function NodeLine({
  a,
  b,
  color = "#a0d8ff",
}: {
  a: Vec3;
  b: Vec3;
  color?: string;
}) {
  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a[0], a[1], a[2]),
      new THREE.Vector3(b[0], b[1], b[2]),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.55,
    });
    return new THREE.Line(geo, mat);
  }, [a, b, color]);
  return <primitive object={line} />;
}

// -----------------------------------------------------------------------------
// Bridge — a flat deck on two simple posts.
// -----------------------------------------------------------------------------
function Bridge({
  position,
  rotation = [0, 0, 0],
  length = 2,
  deckColor = "#a88a6a",
  postColor = "#6a4a32",
  scale = 1,
}: {
  position: Vec3;
  rotation?: Vec3;
  length?: number;
  deckColor?: string;
  postColor?: string;
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.12, 0.6]} />
        <Clay color={deckColor} />
      </mesh>
      <mesh position={[-length / 3, -0.1, 0]} castShadow>
        <boxGeometry args={[0.1, 0.8, 0.4]} />
        <Clay color={postColor} />
      </mesh>
      <mesh position={[length / 3, -0.1, 0]} castShadow>
        <boxGeometry args={[0.1, 0.8, 0.4]} />
        <Clay color={postColor} />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Building — a box body with a 4-sided cone roof.
// -----------------------------------------------------------------------------
function Building({
  position,
  scale = 1,
  bodyColor = "#d8c8a8",
  roofColor = "#a8786a",
  rotation = [0, 0, 0],
}: {
  position: Vec3;
  scale?: number;
  bodyColor?: string;
  roofColor?: string;
  rotation?: Vec3;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1.2, 1]} />
        <Clay color={bodyColor} />
      </mesh>
      <mesh position={[0, 1.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.85, 0.6, 4]} />
        <Clay color={roofColor} />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Crane — a vertical mast with a horizontal jib that swings on Y via sine.
// -----------------------------------------------------------------------------
function Crane({
  position,
  scale = 1,
  color = "#e0a858",
  rotation = [0, 0, 0],
}: {
  position: Vec3;
  scale?: number;
  color?: string;
  rotation?: Vec3;
}) {
  const jibRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (jibRef.current) {
      jibRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.45;
    }
  });
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Mast */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 3, 8]} />
        <Clay color={color} />
      </mesh>
      {/* Cab */}
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.15, 8]} />
        <Clay color={color} />
      </mesh>
      {/* Swinging jib group */}
      <group ref={jibRef} position={[0, 3, 0]}>
        <mesh position={[1, 0.05, 0]} castShadow>
          <boxGeometry args={[2.6, 0.12, 0.18]} />
          <Clay color={color} />
        </mesh>
        <mesh position={[2, 0.05, 0]} castShadow>
          <boxGeometry args={[0.05, 0.3, 0.05]} />
          <Clay color="#6a4a32" />
        </mesh>
        {/* Hanging load */}
        <mesh position={[2, -0.4, 0]} castShadow>
          <boxGeometry args={[0.3, 0.25, 0.3]} />
          <Clay color="#c8a888" />
        </mesh>
      </group>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Signpost — a post with two angled sign boards.
// -----------------------------------------------------------------------------
function Signpost({
  position,
  rotation = [0, 0, 0],
  boardColor = "#e0c890",
}: {
  position: Vec3;
  rotation?: Vec3;
  boardColor?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 1.2, 8]} />
        <Clay color="#6a4a32" />
      </mesh>
      <mesh position={[0.12, 1.05, 0]} rotation={[0, 0, -0.12]} castShadow>
        <boxGeometry args={[0.55, 0.16, 0.03]} />
        <Clay color={boardColor} emissiveIntensity={0.06} />
      </mesh>
      <mesh position={[-0.1, 0.82, 0]} rotation={[0, 0, 0.12]} castShadow>
        <boxGeometry args={[0.55, 0.16, 0.03]} />
        <Clay color={boardColor} emissiveIntensity={0.06} />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Mist — a large transparent circle lying flat that slowly rotates.
// -----------------------------------------------------------------------------
function Mist({
  position,
  scale = 1,
  color = "#e8e8f0",
  speed = 0.1,
}: {
  position: Vec3;
  scale?: number;
  color?: string;
  speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed;
  });
  return (
    <mesh
      ref={ref}
      position={position}
      rotation={[Math.PI / 2, 0, 0]}
      scale={scale}
      receiveShadow
    >
      <circleGeometry args={[2.2, 28]} />
      <Clay color={color} transparent opacity={0.28} emissiveIntensity={0.05} />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Campfire — two crossed logs plus a cone flame that flickers in scale.
// -----------------------------------------------------------------------------
function Campfire({
  position,
  scale = 1,
}: {
  position: Vec3;
  scale?: number;
}) {
  const flameRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const flicker =
      0.85 + Math.sin(t * 12) * 0.15 + Math.sin(t * 7.3) * 0.1;
    if (flameRef.current) flameRef.current.scale.set(1, flicker, 1);
    if (matRef.current) matRef.current.emissiveIntensity = 0.7 + flicker * 0.4;
  });
  return (
    <group position={position} scale={scale}>
      {/* Crossed logs */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.9, 6]} />
        <Clay color="#5a3a22" />
      </mesh>
      <mesh
        rotation={[Math.PI / 2, 0, Math.PI / 2.4]}
        position={[0, 0.12, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.07, 0.07, 0.9, 6]} />
        <Clay color="#6a4a32" />
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[0, 0.4, 0]} castShadow>
        <coneGeometry args={[0.18, 0.55, 10]} />
        <meshStandardMaterial
          ref={matRef}
          color="#ffa848"
          emissive="#ffa848"
          emissiveIntensity={0.8}
          roughness={0.4}
        />
      </mesh>
      {/* Inner flame core */}
      <mesh position={[0, 0.35, 0]}>
        <coneGeometry args={[0.09, 0.3, 8]} />
        <meshStandardMaterial
          color="#ffe080"
          emissive="#ffe080"
          emissiveIntensity={0.9}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Tent — a triangular prism (cylinder with 3 radial segments) laid on its
// side so the ridge is horizontal and the apex points up.
// Rotation [0, 0, PI/2] turns the cylinder axis from Y to X (horizontal),
// placing one vertex straight up — the classic tent silhouette.
// -----------------------------------------------------------------------------
function Tent({
  position,
  rotation = [0, 0, 0],
  color = "#d08888",
  scale = 1,
}: {
  position: Vec3;
  rotation?: Vec3;
  color?: string;
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh
        position={[0, 0.6, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.8, 0.8, 1.4, 3]} />
        <Clay color={color} />
      </mesh>
      {/* Door slit — a darker thin box on the front face */}
      <mesh position={[0, 0.45, 0.01]} castShadow>
        <boxGeometry args={[0.04, 0.5, 0.02]} />
        <Clay color="#8a4848" />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Telescope — a tilted tube on three splayed tripod legs.
// -----------------------------------------------------------------------------
function Telescope({
  position,
  rotation = [0, 0, 0],
  color = "#7a7a8a",
  scale = 1,
}: {
  position: Vec3;
  rotation?: Vec3;
  color?: string;
  scale?: number;
}) {
  const legs = useMemo(() => {
    return [0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2;
      const x = Math.cos(a) * 0.25;
      const z = Math.sin(a) * 0.25;
      // Tilt each leg outward from the centre pivot
      const tilt: Vec3 = [z * 0.6, 0, -x * 0.6];
      return { x, z, tilt, pos: [x * 0.5, 0.35, z * 0.5] as Vec3 };
    });
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {legs.map((l, i) => (
        <mesh key={i} position={l.pos} rotation={l.tilt} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.75, 6]} />
          <Clay color="#6a4a32" />
        </mesh>
      ))}
      {/* Central hub */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.08, 10, 8]} />
        <Clay color="#5a4a32" />
      </mesh>
      {/* Tube — tilted up toward the sky */}
      <mesh
        position={[0, 1.0, -0.1]}
        rotation={[Math.PI / 2 + 0.6, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.09, 0.09, 0.9, 14]} />
        <Clay color={color} />
      </mesh>
      {/* Eyepiece */}
      <mesh position={[0, 1.45, 0.18]} rotation={[Math.PI / 2 + 0.6, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 10]} />
        <Clay color="#4a4a5a" />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// GlowingTree — a tree whose canopy pulses in emissive intensity.
// The centrepiece of the Reinvention convergence scene.
// -----------------------------------------------------------------------------
function GlowingTree({
  position,
  scale = 1,
  canopyColor = "#b88ad8",
}: {
  position: Vec3;
  scale?: number;
  canopyColor?: string;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 1.6) * 0.28;
    if (matRef.current) matRef.current.emissiveIntensity = pulse;
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 1.2, 8]} />
        <Clay color="#7a5a3a" />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.72, 18, 18]} />
        <meshStandardMaterial
          ref={matRef}
          color={canopyColor}
          emissive={canopyColor}
          emissiveIntensity={0.5}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0.3, 1.95, 0.1]} castShadow>
        <sphereGeometry args={[0.4, 14, 14]} />
        <meshStandardMaterial
          color={canopyColor}
          emissive={canopyColor}
          emissiveIntensity={0.4}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Flower — a thin stem, a yellow centre and a ring of petal spheres.
// -----------------------------------------------------------------------------
function Flower({
  position,
  color = "#f0a0c0",
  scale = 1,
}: {
  position: Vec3;
  color?: string;
  scale?: number;
}) {
  const petals = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return [Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13] as Vec3;
      }),
    []
  );
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.4, 6]} />
        <Clay color="#5a8a4a" />
      </mesh>
      <mesh position={[0.06, 0.3, 0]} rotation={[0, 0, -0.5]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <Clay color="#6aa05a" />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <Clay color="#f0e060" emissiveIntensity={0.25} />
      </mesh>
      {petals.map((p, i) => (
        <mesh key={i} position={[p[0], 0.42, p[2]]} castShadow>
          <sphereGeometry args={[0.055, 8, 8]} />
          <Clay color={color} emissiveIntensity={0.18} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================================
// DIORAMA 0 — GENESIS
// A tiny workshop carved into a hillside: scattered blueprints, a mechanical
// contraption, three rotating gears, and half-assembled inventions.
// Atmosphere: curious, experimental. Ground: soft sage green.
// =============================================================================
function Diorama0({ accent }: { accent: string }) {
  return (
    <group>
      <GroundDisc color="#c8d8b8" />

      {/* Two small hills forming the hillside */}
      <Hill position={[-5, -0.1, -4]} scale={3.2} color="#9ab58a" />
      <Hill position={[6, -0.1, -6]} scale={2.6} color="#8aaa78" />

      {/* Workshop contraption — cylinders + spheres */}
      <group position={[1.2, 0, 1.0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.35, 0.8, 12]} />
          <Clay color="#a89888" />
        </mesh>
        <mesh position={[0, 0.95, 0]} castShadow>
          <sphereGeometry args={[0.25, 14, 12]} />
          <Clay color="#c8b8a8" />
        </mesh>
        <mesh position={[0.3, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 10]} />
          <Clay color="#8a7a6a" />
        </mesh>
        <mesh position={[0.6, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.12, 10, 8]} />
          <Clay color={accent} emissiveIntensity={0.2} />
        </mesh>
      </group>

      {/* Three rotating gears */}
      <Gear position={[-1.5, 1.2, 0.5]} scale={1.1} color="#c0c0b0" speed={1.2} />
      <Gear position={[-0.3, 1.6, 0.8]} scale={0.8} color="#b8a888" speed={-1.6} />
      <Gear position={[-2.6, 1.0, 0.3]} scale={0.7} color="#a8b8a8" speed={0.9} />

      {/* Gear mount post */}
      <mesh position={[-1.5, 0.6, 0.5]} castShadow>
        <boxGeometry args={[3, 1.2, 0.3]} />
        <Clay color="#9a8a72" />
      </mesh>

      {/* Scattered blueprints */}
      <Paper position={[2.5, 0.01, 1.5]} rotation={[0, 0.4, 0]} />
      <Paper position={[3.0, 0.01, 0.2]} rotation={[0, -0.2, 0]} color="#e8e8d0" />
      <Paper position={[1.0, 0.01, 2.8]} rotation={[0, 0.9, 0]} color="#e0e8d8" size={[0.6, 0.02, 0.8]} />
      <Paper position={[-3.2, 0.01, 1.8]} rotation={[0, 1.2, 0]} />

      {/* Partially assembled inventions */}
      <group position={[-3.5, 0, -1.5]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.6, 0.5, 0.6]} />
          <Clay color="#b0a898" />
        </mesh>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />
          <Clay color="#988a78" />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <sphereGeometry args={[0.15, 10, 8]} />
          <Clay color={accent} emissiveIntensity={0.25} />
        </mesh>
      </group>

      {/* Trees, rocks */}
      <Tree position={[4.5, 0, -2]} scale={1.2} color="#7aaa6a" />
      <Tree position={[-5.5, 0, 1]} scale={1.0} color="#6a9a5a" />
      <Rock position={[2.0, 0, -2.5]} scale={0.9} />
      <Rock position={[-2.0, 0, 2.5]} scale={0.7} color="#988878" />
      <Rock position={[3.5, 0, -1.0]} scale={0.6} color="#a89888" />

      {/* Atmosphere */}
      <Cloud position={[-4, 6, -8]} scale={1.4} color="#ffffff" speed={0.25} range={6} />
      <Cloud position={[5, 7, -10]} scale={1.2} color="#f0f0f8" speed={0.18} range={5} />
      <Bird position={[0, 6, 0]} scale={1} color="#f0d0b0" speed={0.35} radius={5} />
    </group>
  );
}

// =============================================================================
// DIORAMA 1 — DISCOVERY
// A cozy overlook on a hill: stacked books, a telescope, five glowing nodes
// linked by lines, and curved pathway rings.
// Atmosphere: wondrous, observant. Ground: soft mint.
// =============================================================================
function Diorama1({ accent }: { accent: string }) {
  // Node positions (slightly above ground)
  const nodes: Vec3[] = useMemo(
    () => [
      [-2.2, 1.6, -1.5],
      [2.0, 1.4, -1.0],
      [0.2, 2.4, -2.0],
      [-1.0, 1.2, 2.0],
      [2.2, 1.8, 1.6],
    ],
    []
  );
  // Line pairs connecting the nodes into a loose constellation
  const pairs: [Vec3, Vec3][] = useMemo(
    () => [
      [nodes[0], nodes[2]],
      [nodes[1], nodes[2]],
      [nodes[2], nodes[3]],
      [nodes[2], nodes[4]],
      [nodes[1], nodes[4]],
      [nodes[0], nodes[3]],
    ],
    [nodes]
  );

  return (
    <group>
      <GroundDisc color="#c0e0d0" />

      {/* Overlook hill */}
      <Hill position={[0, -0.1, -1]} scale={4} color="#9acaa0" />

      {/* Stacked books — three boxes of decreasing size */}
      <group position={[1.5, 0, 0.8]} rotation={[0, -0.3, 0]}>
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.0, 0.16, 0.7]} />
          <Clay color="#e0a0a0" />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.14, 0.6]} />
          <Clay color="#a0c0e0" />
        </mesh>
        <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.12, 0.5]} />
          <Clay color="#c0c0a0" />
        </mesh>
      </group>

      {/* Telescope on the overlook */}
      <Telescope position={[-1.0, 0.4, -0.8]} scale={1.1} color="#7a8a9a" />

      {/* Glowing nodes + connecting lines */}
      {pairs.map((p, i) => (
        <NodeLine key={i} a={p[0]} b={p[1]} color={accent} />
      ))}
      {nodes.map((n, i) => (
        <GlowingNode key={i} position={n} color={accent} />
      ))}

      {/* Curved pathway rings leading up the hill */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.4, 1.7, 32]} />
        <Clay color="#b0d8c0" />
      </mesh>
      <mesh position={[0.3, 0.4, -1.2]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
        <ringGeometry args={[1.0, 1.25, 32]} />
        <Clay color="#a8d0b8" />
      </mesh>
      <mesh position={[0.5, 0.9, -2.0]} rotation={[-Math.PI / 2, 0, 0.4]} receiveShadow>
        <ringGeometry args={[0.7, 0.9, 32]} />
        <Clay color="#a0c8b0" />
      </mesh>

      {/* Foliage */}
      <Tree position={[3.0, 0, 2.5]} scale={1.1} color="#7ab086" />
      <Tree position={[-3.5, 0, 1.5]} scale={1.0} color="#6aa076" />
      <Bush position={[-2.5, 0, -2.5]} scale={1.0} color="#6aaa6a" />

      {/* Atmosphere */}
      <Cloud position={[-5, 6, -8]} scale={1.3} color="#ffffff" speed={0.22} range={6} />
      <Cloud position={[6, 7, -10]} scale={1.1} color="#f4f8f8" speed={0.16} range={5} />
      <Bird position={[0, 7, 0]} scale={1} color="#f0d8c0" speed={0.3} radius={6} />
    </group>
  );
}

// =============================================================================
// DIORAMA 2 — CHALLENGE
// A fractured path, two broken bridges, a small maze, a signpost and a
// glowing lantern. Atmosphere: testing, precarious. Ground: soft tan.
// =============================================================================
function Diorama2({ accent }: { accent: string }) {
  return (
    <group>
      <GroundDisc color="#e0d0b8" />

      {/* Three hills */}
      <Hill position={[-6, -0.1, -5]} scale={3} color="#d0b890" />
      <Hill position={[6, -0.1, -4]} scale={2.4} color="#c8b088" />
      <Hill position={[0, -0.1, -7]} scale={2.8} color="#d4bc94" />

      {/* Fractured path — five segments at varying heights/rotations */}
      <mesh position={[-3, 0.1, 1]} rotation={[0, 0.1, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.15, 0.8]} />
        <Clay color="#c8a878" />
      </mesh>
      <mesh position={[-1.5, 0.35, 0.7]} rotation={[0, -0.1, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.15, 0.8]} />
        <Clay color="#c0a070" />
      </mesh>
      <mesh position={[0, 0.2, 1.0]} rotation={[0, 0.05, 0.04]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.15, 0.8]} />
        <Clay color="#c8a878" />
      </mesh>
      <mesh position={[1.6, 0.5, 0.5]} rotation={[0, -0.15, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.15, 0.8]} />
        <Clay color="#b89868" />
      </mesh>
      <mesh position={[3.2, 0.3, 0.9]} rotation={[0, 0.1, 0.06]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.15, 0.8]} />
        <Clay color="#c0a070" />
      </mesh>

      {/* Two broken bridges — deck segments with a gap */}
      <group position={[-1.5, 0.1, -1.5]} rotation={[0, 0.3, 0]}>
        <Bridge position={[-0.7, 0, 0]} length={1.2} deckColor="#b89868" />
        <Bridge position={[0.7, 0.1, 0]} length={1.2} deckColor="#b89868" />
      </group>
      <group position={[2.5, 0.1, -1.0]} rotation={[0, -0.2, 0]}>
        <Bridge position={[-0.6, 0, 0]} length={1.0} deckColor="#a88858" />
        <Bridge position={[0.6, 0.15, 0]} length={1.0} deckColor="#a88858" />
      </group>

      {/* Small maze — low box walls forming an L */}
      <group position={[4.5, 0, 2.5]}>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.5, 0.2]} />
          <Clay color="#c8b888" />
        </mesh>
        <mesh position={[0.7, 0.25, 0.6]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.5, 1.2]} />
          <Clay color="#c0b080" />
        </mesh>
        <mesh position={[-0.4, 0.25, 0.6]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.5, 0.8]} />
          <Clay color="#c8b888" />
        </mesh>
      </group>

      {/* Signpost + glowing lantern */}
      <Signpost position={[-2.5, 0, 2.5]} rotation={[0, -0.4, 0]} />
      <Lantern position={[0.5, 0, -2.5]} color={accent} />

      {/* Foliage + rocks */}
      <Tree position={[-4, 0, 2]} scale={1.0} color="#8aa870" />
      <Bush position={[3, 0, 3]} scale={1.0} color="#7a9a5a" />
      <Rock position={[-1, 0, 2.5]} scale={0.8} color="#b8a888" />
      <Rock position={[2, 0, -3]} scale={0.7} color="#a89878" />
      <Rock position={[-3.5, 0, -1]} scale={0.6} color="#b0a080" />

      {/* Atmosphere */}
      <Cloud position={[-5, 6, -9]} scale={1.2} color="#faf0e0" speed={0.2} range={6} />
      <Bird position={[0, 6.5, 0]} scale={1} color="#e8c8a0" speed={0.32} radius={5} />
    </group>
  );
}

// =============================================================================
// DIORAMA 3 — GROWTH
// A construction site: four buildings (one scaffolded), a swinging crane,
// two connecting bridges and a circular ground path.
// Atmosphere: building, expanding. Ground: soft blue-grey.
// =============================================================================
function Diorama3({ accent }: { accent: string }) {
  return (
    <group>
      <GroundDisc color="#c8d0d8" />

      {/* Four buildings of different sizes */}
      <Building position={[-3, 0, -1]} scale={1.2} bodyColor="#d0d0e0" roofColor="#a08898" />
      <Building position={[3, 0, -1.5]} scale={0.9} bodyColor="#c8c8d8" roofColor="#987888" />
      <Building position={[1.5, 0, 2.5]} scale={0.7} bodyColor="#d8d8e8" roofColor="#a890a0" />

      {/* Tallest building with scaffolding cage */}
      <group position={[0, 0, -2]}>
        <Building position={[0, 0, 0]} scale={1.6} bodyColor="#c0c0d0" roofColor="#908098" />
        {/* Scaffolding — thin box cage around the body */}
        {[
          [-0.85, 0, -0.85],
          [0.85, 0, -0.85],
          [-0.85, 0, 0.85],
          [0.85, 0, 0.85],
        ].map((p, i) => (
          <mesh key={i} position={[p[0], 1.0, p[2]]} castShadow>
            <boxGeometry args={[0.05, 2.4, 0.05]} />
            <Clay color="#b08848" />
          </mesh>
        ))}
        {/* Horizontal scaffold rings */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1.8, 0.04, 1.8]} />
          <Clay color="#b08848" />
        </mesh>
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[1.8, 0.04, 1.8]} />
          <Clay color="#b08848" />
        </mesh>
      </group>

      {/* Crane swinging nearby */}
      <Crane position={[-1.5, 0, 1.5]} scale={1.1} color="#e0a858" />

      {/* Two connecting bridges */}
      <Bridge position={[-1.5, 0, -0.5]} rotation={[0, Math.PI / 2, 0]} length={1.6} deckColor="#b0a8b8" />
      <Bridge position={[2.2, 0, 0.5]} rotation={[0, Math.PI / 2, 0]} length={1.8} deckColor="#a8a0b0" />

      {/* Ground path circle */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[3.2, 3.6, 48]} />
        <Clay color="#b8c0c8" />
      </mesh>

      {/* Foliage */}
      <Tree position={[-4.5, 0, 2]} scale={1.0} color="#7a9a8a" />
      <Tree position={[4.5, 0, 1.5]} scale={1.0} color="#6a8a7a" />
      <Bush position={[0, 0, 3.5]} scale={1.0} color="#7a9a7a" />

      {/* Atmosphere */}
      <Cloud position={[-5, 6, -8]} scale={1.3} color="#ffffff" speed={0.22} range={6} />
      <Cloud position={[5, 7, -9]} scale={1.1} color="#f0f0f8" speed={0.17} range={5} />
      <Bird position={[0, 7, 0]} scale={1} color="#e8d8c8" speed={0.3} radius={6} />
    </group>
  );
}

// =============================================================================
// DIORAMA 4 — APEX
// A summit hill with an observation platform, bench, distant mountain peaks,
// a fluttering flag and a pulsing lantern.
// Atmosphere: triumphant, panoramic. Ground: soft lavender.
// =============================================================================
function Diorama4({ accent }: { accent: string }) {
  return (
    <group>
      <GroundDisc color="#e0d0e8" />

      {/* Summit — large squashed sphere hill */}
      <mesh position={[0, -0.1, 0]} scale={[5, 2.5, 5]} castShadow receiveShadow>
        <sphereGeometry args={[1, 28, 20]} />
        <Clay color="#c8b0d8" />
      </mesh>

      {/* Observation platform on top */}
      <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.6, 1.8, 0.25, 28]} />
        <Clay color="#d8c8e0" />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.06, 28]} />
        <Clay color="#e0d0e8" />
      </mesh>

      {/* Bench on the platform */}
      <group position={[0.6, 2.7, 0]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.7, 0.06, 0.25]} />
          <Clay color="#a888b8" />
        </mesh>
        <mesh position={[0.3, 0.07, 0]} castShadow>
          <boxGeometry args={[0.06, 0.16, 0.25]} />
          <Clay color="#8a6a9a" />
        </mesh>
        <mesh position={[-0.3, 0.07, 0]} castShadow>
          <boxGeometry args={[0.06, 0.16, 0.25]} />
          <Clay color="#8a6a9a" />
        </mesh>
        <mesh position={[0, 0.3, -0.1]} castShadow>
          <boxGeometry args={[0.7, 0.3, 0.05]} />
          <Clay color="#9a78a8" />
        </mesh>
      </group>

      {/* Flag + lantern on the summit */}
      <Flag position={[-0.6, 2.5, 0]} clothColor={accent} />
      <Lantern position={[0.8, 2.5, 0.5]} color="#ffd070" scale={0.8} />

      {/* Four distant mountain peaks (atmospheric perspective — lighter) */}
      <mesh position={[-14, 1, -14]} rotation={[0, 0.5, 0]} castShadow>
        <coneGeometry args={[3, 6, 6]} />
        <Clay color="#d8c8e8" emissiveIntensity={0.05} />
      </mesh>
      <mesh position={[14, 1.5, -13]} rotation={[0, -0.3, 0]} castShadow>
        <coneGeometry args={[3.5, 7, 6]} />
        <Clay color="#dcd0ec" emissiveIntensity={0.05} />
      </mesh>
      <mesh position={[-13, 0.8, 13]} rotation={[0, 0.8, 0]} castShadow>
        <coneGeometry args={[2.8, 5.5, 6]} />
        <Clay color="#d4c4e4" emissiveIntensity={0.05} />
      </mesh>
      <mesh position={[13, 1.2, 14]} rotation={[0, -0.6, 0]} castShadow>
        <coneGeometry args={[3.2, 6.5, 6]} />
        <Clay color="#d8cce8" emissiveIntensity={0.05} />
      </mesh>

      {/* Foliage */}
      <Bush position={[2, 0.3, 2]} scale={1.0} color="#9a7aaa" />
      <Rock position={[-2.5, 0.3, 2.5]} scale={0.9} color="#b8a8c8" />

      {/* Atmosphere — extra clouds and two birds for the open sky */}
      <Cloud position={[-6, 7, -8]} scale={1.4} color="#ffffff" speed={0.2} range={7} />
      <Cloud position={[6, 8, -10]} scale={1.2} color="#f8f0fc" speed={0.15} range={6} />
      <Cloud position={[0, 9, -12]} scale={1.5} color="#ffffff" speed={0.12} range={8} />
      <Bird position={[-2, 8, 0]} scale={1} color="#e8d0e0" speed={0.28} radius={5} />
      <Bird position={[2, 9, 0]} scale={0.9} color="#f0d8e8" speed={0.34} radius={6} />
    </group>
  );
}

// =============================================================================
// DIORAMA 5 — TRANSITION
// A misty fork: a central clearing, three trail rings leading outward,
// two signposts and four slowly-rotating mist patches.
// Atmosphere: contemplative, uncertain. Ground: soft blue-grey.
// =============================================================================
function Diorama5({ accent }: { accent: string }) {
  return (
    <group>
      <GroundDisc color="#d0d8e0" />

      {/* Central clearing disc */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2, 36]} />
        <Clay color="#c4ccd4" />
      </mesh>

      {/* Three trail rings leading outward at different angles */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[2.2, 2.5, 36]} />
        <Clay color="#bcc4cc" />
      </mesh>
      <mesh position={[3.2, 0.02, -1.0]} rotation={[-Math.PI / 2, 0, 0.5]} receiveShadow>
        <ringGeometry args={[1.2, 1.45, 32]} />
        <Clay color="#b4bcc4" />
      </mesh>
      <mesh position={[-3.2, 0.02, -1.0]} rotation={[-Math.PI / 2, 0, -0.5]} receiveShadow>
        <ringGeometry args={[1.2, 1.45, 32]} />
        <Clay color="#b4bcc4" />
      </mesh>
      <mesh position={[0, 0.02, 3.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.2, 1.45, 32]} />
        <Clay color="#b4bcc4" />
      </mesh>

      {/* Two signposts at the fork */}
      <Signpost position={[0.6, 0, 0.6]} rotation={[0, 0.4, 0]} boardColor="#d8d0b0" />
      <Signpost position={[-0.6, 0, 0.6]} rotation={[0, -0.4, 0]} boardColor="#d8d0b0" />

      {/* Four mist patches slowly rotating */}
      <Mist position={[3.5, 0.1, 0]} scale={1.3} color="#e8ecf0" speed={0.12} />
      <Mist position={[-3.5, 0.1, 0]} scale={1.3} color="#e8ecf0" speed={0.1} />
      <Mist position={[0, 0.1, 3.5]} scale={1.4} color="#eef0f4" speed={0.14} />
      <Mist position={[0, 0.1, -3.5]} scale={1.4} color="#eef0f4" speed={0.09} />

      {/* Lantern at the centre */}
      <Lantern position={[0, 0, 0]} color={accent} scale={0.9} />

      {/* Three small trees + bush */}
      <Tree position={[4.5, 0, 1.5]} scale={0.8} color="#7a9a8a" />
      <Tree position={[-4.5, 0, 1.5]} scale={0.8} color="#6a8a7a" />
      <Tree position={[0, 0, 5]} scale={0.8} color="#7a9a8a" />
      <Bush position={[1.5, 0, -1.5]} scale={0.9} color="#7a9a7a" />

      {/* Atmosphere */}
      <Cloud position={[-5, 6, -8]} scale={1.3} color="#f4f6f8" speed={0.18} range={6} />
      <Cloud position={[5, 7, -9]} scale={1.1} color="#eef0f4" speed={0.14} range={5} />
    </group>
  );
}

// =============================================================================
// DIORAMA 6 — REINVENTION
// A convergence: a circular garden ring with a glowing tree at the centre,
// surrounded by miniature echoes of earlier checkpoints (workshop piece,
// gear, book, bridge, building, mountain cone, signpost).
// Atmosphere: integrating, hopeful. Ground: soft green.
// =============================================================================
function Diorama6({ accent }: { accent: string }) {
  return (
    <group>
      <GroundDisc color="#d0e0c0" />

      {/* Circular garden ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[3.2, 3.6, 48]} />
        <Clay color="#b8d8a8" />
      </mesh>

      {/* Glowing tree at centre */}
      <GlowingTree position={[0, 0, 0]} scale={1.2} canopyColor={accent} />

      {/* Converging elements — miniature echoes of the journey */}
      {/* Workshop piece */}
      <group position={[2.5, 0, 2.5]}>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.4, 0.5]} />
          <Clay color="#a89888" />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
          <Clay color="#887a68" />
        </mesh>
      </group>
      {/* Gear */}
      <Gear position={[-2.5, 0.4, 2.5]} scale={0.6} color="#b8b8a8" speed={1.0} />
      {/* Book */}
      <mesh position={[2.5, 0.07, -2.5]} rotation={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.12, 0.4]} />
        <Clay color="#e0a0a0" />
      </mesh>
      {/* Bridge */}
      <Bridge position={[-2.5, 0, -2.5]} rotation={[0, 0.5, 0]} length={1.2} deckColor="#a88a6a" />
      {/* Building */}
      <Building position={[3.8, 0, 0]} scale={0.6} bodyColor="#d0c8a8" roofColor="#a88878" />
      {/* Tiny mountain cone */}
      <mesh position={[-3.8, 0, 0]} castShadow>
        <coneGeometry args={[0.7, 1.4, 6]} />
        <Clay color="#b8a8c8" />
      </mesh>
      {/* Signpost */}
      <Signpost position={[0, 0, 3.8]} rotation={[0, 0, 0]} boardColor="#e0d8a8" />

      {/* Foliage */}
      <Tree position={[1.8, 0, 4.5]} scale={0.9} color="#7aaa6a" />
      <Tree position={[-1.8, 0, 4.5]} scale={0.9} color="#6a9a5a" />
      <Bush position={[4.5, 0, 2.5]} scale={0.9} color="#6a9a5a" />
      <Bush position={[-4.5, 0, 2.5]} scale={0.9} color="#7aa86a" />

      {/* Flowers */}
      <Flower position={[1.2, 0, 1.2]} color="#f0a0c0" scale={1.2} />
      <Flower position={[-1.2, 0, 1.2]} color="#f0c060" scale={1.2} />
      <Flower position={[1.2, 0, -1.2]} color="#a0c0f0" scale={1.2} />
      <Flower position={[-1.2, 0, -1.2]} color="#c0a0f0" scale={1.2} />

      {/* Atmosphere */}
      <Cloud position={[-5, 6, -8]} scale={1.3} color="#ffffff" speed={0.22} range={6} />
      <Cloud position={[5, 7, -9]} scale={1.1} color="#f4fcf4" speed={0.16} range={5} />
      <Bird position={[0, 7, 0]} scale={1} color="#f0e0c0" speed={0.3} radius={6} />
    </group>
  );
}

// =============================================================================
// DIORAMA 7 — PRESENT
// A winding trail of six rings leading to a camp: tent, campfire, and a
// small observatory. A lone tree, bush, rock, lantern and flag complete it.
// Atmosphere: arrival, reflective. Ground: soft teal.
// =============================================================================
function Diorama7({ accent }: { accent: string }) {
  // Six trail ring segments at increasing angles — a winding path
  const trailRings = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = i * 0.45;
        const r = 1.0 + i * 0.8;
        return {
          pos: [Math.cos(a) * r, 0.02, Math.sin(a) * r] as Vec3,
          rot: a,
          inner: 0.5 + i * 0.05,
          outer: 0.75 + i * 0.05,
          color: i % 2 === 0 ? "#b0d8d8" : "#a8d0d0",
        };
      }),
    []
  );

  return (
    <group>
      <GroundDisc color="#c8e0e0" />

      {/* Winding trail rings */}
      {trailRings.map((t, i) => (
        <mesh
          key={i}
          position={t.pos}
          rotation={[-Math.PI / 2, 0, t.rot]}
          receiveShadow
        >
          <ringGeometry args={[t.inner, t.outer, 28]} />
          <Clay color={t.color} />
        </mesh>
      ))}

      {/* Tent at the end of the trail */}
      <Tent position={[2.5, 0, 2.5]} rotation={[0, -0.5, 0]} color="#d08888" />

      {/* Campfire next to the tent */}
      <Campfire position={[1.2, 0, 2.2]} scale={1} />

      {/* Observatory — cylinder base + half-sphere dome */}
      <group position={[-2.5, 0, -2.5]}>
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.8, 0.9, 1.0, 20]} />
          <Clay color="#c0d8d8" />
        </mesh>
        {/* Dome — sphere scaled to a half, sitting on the base */}
        <mesh position={[0, 1.0, 0]} scale={[1, 0.7, 1]} castShadow>
          <sphereGeometry args={[0.8, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Clay color="#a8c8c8" />
        </mesh>
        {/* Slit opening */}
        <mesh position={[0, 1.1, 0.78]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.05]} />
          <Clay color="#4a5a5a" />
        </mesh>
      </group>

      {/* Lone tree, bush, rock, lantern, flag */}
      <Tree position={[-1.5, 0, 1.5]} scale={1.1} color="#6aa098" />
      <Bush position={[0.5, 0, 0.5]} scale={1.0} color="#6a9a8a" />
      <Rock position={[3.5, 0, -1.0]} scale={0.8} color="#a8c0c0" />
      <Lantern position={[3.8, 0, 1.5]} color={accent} />
      <Flag position={[-2.5, 0, -1.0]} clothColor={accent} />

      {/* Atmosphere */}
      <Cloud position={[-5, 6, -8]} scale={1.3} color="#ffffff" speed={0.2} range={6} />
      <Cloud position={[5, 7, -9]} scale={1.1} color="#f0fcfc" speed={0.15} range={5} />
      <Bird position={[0, 7, 0]} scale={1} color="#e0d8c8" speed={0.3} radius={6} />
    </group>
  );
}

// =============================================================================
// Main export — switches on the checkpoint id (0..7).
// The `accent` colour is threaded into flags, lanterns, glowing nodes and
// the glowing tree so each checkpoint reads with its own signature hue.
// =============================================================================
export function CheckpointDiorama({
  id,
  accent,
}: {
  id: number;
  accent: string;
}) {
  switch (id) {
    case 0:
      return <Diorama0 accent={accent} />;
    case 1:
      return <Diorama1 accent={accent} />;
    case 2:
      return <Diorama2 accent={accent} />;
    case 3:
      return <Diorama3 accent={accent} />;
    case 4:
      return <Diorama4 accent={accent} />;
    case 5:
      return <Diorama5 accent={accent} />;
    case 6:
      return <Diorama6 accent={accent} />;
    case 7:
      return <Diorama7 accent={accent} />;
    default:
      // Fallback to Genesis for any out-of-range id.
      return <Diorama0 accent={accent} />;
  }
}
