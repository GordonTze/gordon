# API Reference — The Journey

> Public interfaces and important functions. Responsibilities, not implementations.

---

## terrain-utils.ts

### Constants

```typescript
export const GRID_SIZE = 200;       // Terrain grid resolution
export const WORLD_SIZE = 72;       // World units across
export const TERRAIN_HEIGHT = 10;   // Height multiplier
```

### `sampleH(nx, ny): number`

**Responsibility:** Compute terrain height at normalized coordinates [0,1].

**Returns:** Height value in normalized units (0 = sea level, ~1 = max peak).

**Notes:** Pure function, no Three.js dependency. Called ~160,000 times at init (4 calls per vertex for normals).

---

### `sampleGrid(ix, iy): number`

**Responsibility:** Wrapper for `sampleH` using integer grid coordinates.

**Parameters:** `ix` [0, GRID_SIZE-1], `iy` [0, GRID_SIZE-1].

---

### `toWorld(nx, ny, h): [number, number, number]`

**Responsibility:** Convert normalized terrain coords + height to world-space [x, y, z].

**Returns:** `[x, y, z]` where y = `h * TERRAIN_HEIGHT` (already multiplied).

**Warning:** Do NOT multiply the returned Y by `TERRAIN_HEIGHT` again.

---

### `elevationColor(h): [number, number, number]`

**Responsibility:** Map a height value to a pastel RGB color via 8-band interpolation.

**Returns:** `[r, g, b]` in range [0, 1].

---

### `CHECKPOINTS: Checkpoint[]`

**Responsibility:** Array of 8 checkpoint definitions.

```typescript
interface Checkpoint {
  id: number;
  nx: number;           // Normalized X position [0,1]
  ny: number;           // Normalized Y position [0,1]
  title: string;        // e.g. "Genesis"
  theme: string;        // e.g. "Curiosity"
  subtitle: string;     // Tagline
  description: string;  // Full paragraph
  accent: string;       // Hex color string, e.g. "#8ecae6"
}
```

---

## TopographicTerrain.tsx

### `<TopographicTerrain />`

**Props:**
```typescript
{
  activeCheckpoint: number | null;    // Selected checkpoint index
  isFlying: boolean;                  // Camera animating
  resetCamera: number;                // Increment to trigger intro fly-back
  onSelectCheckpoint: (i: number) => void;  // Click handler
  onFlyComplete: () => void;          // Called when fly-to finishes
}
```

**Responsibility:** Renders the complete terrain scene: mesh, contours, trail, flags, camera rig.

---

## SceneMediaViewer.tsx

### `<SceneMediaViewer />`

**Props:**
```typescript
{
  id: number;     // Checkpoint index (0-7)
  accent: string; // Hex color for accent lighting
}
```

**Responsibility:** Creates a second `<Canvas>` with the checkpoint's diorama. Per-checkpoint camera, lighting, ground plane.

### `CAMERA_CONFIG`

```typescript
const CAMERA_CONFIG = [
  { focus: [0, 0.5, 0.6], radius: 14.0, height: 6.0, groundColor: '#c8d8b8' },  // Genesis (CP1)
  { focus: [0, 0.4, 0],   radius: 9.0,  height: 5.0, groundColor: '#c0e0d0' },      // Discovery (CP2)
  { focus: [0, 0.35, 0],  radius: 9.0,  height: 5.0, groundColor: '#e0d0b8' },     // Challenge
  { focus: [0.2, 0.4, 0.1], radius: 9.0, height: 5.0, groundColor: '#c8d0d8' },  // Growth
  { focus: [0, 0.6, 0],   radius: 9.0,  height: 5.5, groundColor: '#e0d0e8' },      // Apex
  { focus: [0, 0.35, 0],  radius: 9.0,  height: 4.5, groundColor: '#d0d8e0' },     // Transition
  { focus: [0, 0.5, 0],   radius: 9.0,  height: 5.0, groundColor: '#d0e0c0' },      // Reinvention
  { focus: [0.2, 0.35, -0.2], radius: 9.0, height: 5.0, groundColor: '#c8e0e0' }, // Present
];
```

**Responsibility:** Per-checkpoint camera orbit configuration. Genesis (CP1) has a larger radius (14.0) to show the full workshop; all others use 9.0.

**Note on CP1 camera target blend:** In `TopographicTerrain.tsx`, the fly-to target for CP1 (Genesis) blends `0.35` toward CP2's position (vs `0.1` for every other checkpoint). This prevents the Genesis workshop at `(0, _, 0.6)` from swinging out of frame during orbit. CP1 also uses `zoomDist = 6.7` (same as before). See `decisions.md` → "Per-checkpoint zoom and CP1 camera blend".

---

## CheckpointDiorama.tsx

### `<CheckpointDiorama />`

**Props:**
```typescript
{
  id: number;     // Checkpoint index (0-7)
  accent: string; // Hex color for themed elements
}
```

**Responsibility:** Renders the appropriate diorama for the given checkpoint. No self-rotation.

### Building Block Components (24 total)

All accept position/scale/color props. All use the `Clay` material wrapper (high roughness, low metalness, subtle emissive).

| Component | Purpose |
|---|---|
| `Clay` | Wrapper for meshStandardMaterial with clay defaults (roughness 0.9, metalness 0.1, emissiveIntensity 0.08) |
| `GroundDisc` | Large circular terrain platform (radius 500) |
| `Hill` | Squashed sphere terrain feature |
| `Tree` | Trunk + two canopy spheres |
| `Bush` | Clustered small spheres |
| `Rock` | Squashed dodecahedron |
| `Paper` | Flat blueprint sheet |
| `Gear` | Disc + teeth + hub, rotates on Z |
| `Cloud` | Transparent sphere cluster, drifts horizontally |
| `Bird` | Body + flapping wings, circles in air |
| `Flag` | Pole + fluttering cloth |
| `Lantern` | Pole + pulsing emissive orb |
| `GlowingNode` | Pulsing emissive sphere (scale animation) |
| `NodeLine` | Glowing line between two points |
| `Bridge` | Deck + two posts |
| `Building` | Box body + 4-sided cone roof |
| `Crane` | Mast + swinging jib with hanging load |
| `Signpost` | Pole + two angled boards |
| `Mist` | Rotating transparent circle |
| `Campfire` | Crossed logs + flickering flame |
| `Tent` | Triangular prism (3-segment cylinder) |
| `Telescope` | Tripod legs + tilted tube |
| `GlowingTree` | Trunk + pulsing emissive canopy |
| `Flower` | Stem + center + 5 petal spheres |

---

## page.tsx

### State (all via `useState`)

| State | Type | Purpose |
|---|---|---|
| `activeCheckpoint` | `number \| null` | Selected checkpoint |
| `isFlying` | `boolean` | Camera animating |
| `showScene` | `boolean` | Scene panel open |
| `visited` | `Set<number>` | Visited indices |
| `autoRotate` | `boolean` | Auto-rotate enabled |
| `resetCamera` | `number` | Counter for intro fly-back |
| `showHelp` | `boolean` | Help popup open |

### Event Handlers

| Handler | Trigger | Action |
|---|---|---|
| `handleSelect(idx)` | Click flag / press 1-8 / ←→ | If switching checkpoints: close any open scene first (prevents flash). Set active + flying + autoRotate=false. |
| `handleFlyComplete()` | Camera arrives | Open scene panel. Does NOT set autoRotate=true (removed to prevent GPU competition stutter). |
| `handleEscape()` | Esc key | If scene open: close it + set autoRotate=true. If no scene: reset to intro + set autoRotate=true. |
| `handlePrev()` | ← / A | Previous checkpoint |
| `handleNext()` | → / D | Next checkpoint |
| `handleOpenScene()` | Space / ↑ / W | Open scene panel |
| `handleCloseScene()` | ↓ / S | Close scene panel + set autoRotate=true |
| `handleClose()` | Click backdrop / Back to Map | Close scene panel + set autoRotate=true |

**Auto-rotate rule:** Set to `true` when the scene CLOSES (in `handleClose`, `handleEscape`, `handleCloseScene`) or after 4s of inactivity with no scene open. Set to `false` when the user interacts or when a fly-to starts. NOT set when the scene opens.

---

## Standalone (download/index.html)

### Key Functions

| Function | Equivalent in Next.js |
|---|---|
| `sampleH(nx, ny)` | Same |
| `toWorld(nx, ny, h)` | Same |
| `elevationColor(h)` | Same |
| `selectCheckpoint(idx)` | `handleSelect` |
| `completeFlight()` | `handleFlyComplete` |
| `showScene()` | `setShowScene(true)` |
| `closeScene()` | `handleCloseScene` |
| `goToIntro()` | `handleEscape` (second press) |
| `buildDiorama(id, accent)` | `<CheckpointDiorama id={id} accent={accent} />` |
| `showSculpture(id, accent)` | `<SceneMediaViewer id={id} accent={accent} />` |
| `animateSculpture()` | `useFrame` in OrbitingCamera |
| `animateMain()` | R3F render loop |

### Global State (standalone)

| Variable | Equivalent |
|---|---|
| `activeCheckpoint` | `activeCheckpoint` state |
| `isFlying` | `isFlying` state |
| `isSceneOpen` | `showScene` state |
| `visited` (Set) | `visited` state |
| `ORBIT_TARGET` | `orbitTarget` useMemo |
| `SCULPTURE_CAMERA_CONFIG` | `CAMERA_CONFIG` |
| `sculptureFocus` | Selected config entry |
