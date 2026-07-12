# Architecture — The Journey

> How the system is designed. Focuses on why, not what.

---

## High-Level Architecture

Two parallel implementations of the same 3D experience:

- **Next.js app** (`src/`) — React Three Fiber (R3F) for development with hot reload
- **Standalone HTML** (`download/index.html`) — Vanilla Three.js for GitHub Pages

Both share identical math (`sampleH`, `toWorld`, `elevationColor`), identical checkpoint data, identical terrain rendering, and identical feature sets. The standalone exists because GitHub Pages serves static files — no Node.js build step.

---

## Directory Responsibilities

| Directory | Responsibility |
|---|---|
| `src/app/` | Next.js app router — page, layout, global CSS |
| `src/components/three/` | All 3D logic — terrain, dioramas, camera, viewer |
| `download/` | Standalone single-file HTML mirror |
| `documents/` | Documentation for AI/human continuity |

Unused scaffold directories: `src/components/ui/` (48 shadcn files), `src/hooks/`, `src/lib/` — all from the initial template, don't affect the app. The `examples/` folder (unused WebSocket scaffold) and the `src/app/api/` route (broke static export) have been removed.

---

## Core Systems

### 1. Terrain System (`terrain-utils.ts` + `TopographicTerrain.tsx`)

Pure math module (`terrain-utils.ts`) with no Three.js dependency:
- `sampleH(nx, ny)` — Gaussian heightfield: 4 peaks + saddle + 7 small hills + FBM noise + edge fade
- `toWorld(nx, ny, h)` — Normalized [0,1] → world [x, y, z] (y already multiplied by TERRAIN_HEIGHT)
- `elevationColor(h)` — 8-band pastel interpolation, returns `[r, g, b]`

Rendering (`TopographicTerrain.tsx`):
- `PlaneGeometry` 199×199 segments
- Per-vertex: height + manual finite-difference normals + baked color (hillshade × slope × AO × texture)
- `rotateX(-π/2)` to lay flat
- Single `meshStandardMaterial` with `vertexColors`

**Why vertex-color baking:** Terrain is static — baking shading into vertex colors means zero per-frame GPU cost. No custom shaders needed.

### 2. Contour System

Marching squares algorithm with `LineSegments` (not `Line` — avoids artifacts):
- 22 contour levels, step=5 grid cells
- Major (every 5th) at opacity 0.35, minor at 0.15
- Cyan color (`0x38c0e0`)
- Heights computed via `toWorld(nx, ny, level)` — no double-multiplication

**Why LineSegments:** Regular `THREE.Line` with multiple segments creates visual artifacts (straight lines connecting disconnected loops). `LineSegments` treats each pair of points independently.

### 3. Trail System

`Line2` + `LineMaterial` + `LineGeometry` from `three/examples/jsm/lines/`:
- 4px screen-space linewidth (WebGL ignores `linewidth` on `THREE.Line`)
- Dashed: dashSize=0.6, gapSize=0.35
- Resolution synced to viewport via `useThree().size`

**Why Line2:** The reference design requires a thick dashed trail. `LineDashedMaterial.linewidth` is silently ignored in WebGL — all lines render at 1px. `Line2` uses a screen-space shader for true pixel-width lines.

### 4. Checkpoint Flag System

Reference-style flags per checkpoint:
- Dark thin pole (`0x1a2535`), gold finial (`0xffd700`), pink flag with stripes (`0xffb3d9`/`0xff8fbf`)
- Canvas-texture number sprites (created via `useMemo` inside `<Canvas>`)
- Point lights with animated intensity (beacon pulse)
- Flag flutter animation via `useFrame`
- Invisible click spheres for raycasting

**Why canvas sprites:** `THREE.TextGeometry` requires font loading and is heavy. Canvas textures are lightweight (128×128), created once, and render as billboards.

### 5. Camera System

Dual camera modes:
- **Fly-to** (`CameraRig`): Eased lerp from current position to checkpoint. 3-tier elevation-aware positioning. Per-checkpoint zoom (Genesis: radius 14.0, others: 9.0). Input gated during flight. CP1 (Genesis) camera target blends 0.35 toward CP2 (was 0.1) to avoid the workshop swinging out of frame; CP1 zoomDist=6.7 (unchanged).
- **Orbit** (`OrbitControls` from drei): User drag/zoom when not flying. Target follows active checkpoint via `useMemo`. Auto-rotate re-enabled when the scene CLOSES (`handleClose`/`handleEscape`/`handleCloseScene`) or after 4s inactivity with no scene open. `handleFlyComplete` no longer sets autoRotate (removed to prevent GPU competition stutter when the SceneMediaViewer Canvas mounts).

**Why dual system:** Fly-to provides cinematic transitions. Orbit lets users explore freely. The `isFlying` flag prevents them from fighting each other.

### 6. Diorama System (`CheckpointDiorama.tsx` + `SceneMediaViewer.tsx`)

24 reusable clay-style building blocks (Clay, GroundDisc, Hill, Tree, Bush, Rock, Paper, Gear, Cloud, Bird, Flag, Lantern, GlowingNode, NodeLine, Bridge, Building, Crane, Signpost, Mist, Campfire, Tent, Telescope, GlowingTree, Flower) composed into 8 themed dioramas (Diorama0–Diorama7). Each diorama:
- No self-rotation (camera orbits instead)
- Individual elements animate via `useFrame` (gears spin, birds fly, flags flutter, clouds drift, campfire flickers, glowing nodes pulse)
- Per-checkpoint camera config (focus, radius, height, groundColor)
- Studio cyclorama background (half-cylinder, vertex-color gradient: darkened peach horizon → atmospheric blue top)
- Heavy atmospheric fog (`#8a7560`, near 15, far 50) — darkened for eye comfort
- Volumetric mist planes (4 transparent circles, slowly rotating)
- Extended ground plane (radius 500) with `alpha: false`
- Studio lighting: ambient 0.5 + hemisphere + directional key 1.6 (2048 shadow map, larger frustum) + fill 0.3 + accent point light

**Why no self-rotation:** Rotating the diorama group while the camera also orbits caused the subject to drift off-center. The workshop at (0, _, 0.6) swung around the origin, moving away from the camera's fixed focus point.

**Why cyclorama + fog:** The cyclorama provides a seamless studio backdrop (no hard horizon line). The fog matches the cyclorama's horizon color so distant objects fade naturally into the background. Both were darkened together to `#8a7560` for eye comfort.

### 7. Scene Panel System (`page.tsx`)

Fixed-size overlay card (**1300×780px**, zoom-independent — not vw/vh) centered on viewport with:
- 3D diorama Canvas filling the card (with cyclorama + fog + mist)
- **Sign card** at top center: periwinkle→lavender diagonal gradient (`#b8d0dc` → `#c8b0c8`), navy serif text (Playfair Display), backdrop blur, layered box-shadow. **Fixed px text sizes** (no Tailwind responsive classes — keeps layout zoom-independent): label `text-[13px]` bold (700), title `text-[42px]` black (900), subtitle `text-[17px]` semibold (600) italic, description `text-[15px]`. Label has `pl-[0.3em]` to compensate for trailing `letter-spacing` (centering fix).
- Description + timeline + back button at bottom (8-stop gradient shadow, `minHeight: 280px`, flex column justify-end) — zoom-independent (was previously `60vh`, before that a 3-stop with kink at 35%).
- Auto-opens when camera flight completes
- Closes on Esc/↓/Back to Map — and re-enables auto-rotate on close
- `handleSelect` only closes the scene when switching checkpoints (reopening the same one does not close-and-reopen — prevents a visible flash)

**Why sign card gradient:** Replaces the old multi-layer text-shadow approach. The paper-like card with periwinkle→lavender gradient and navy serif text is more legible and visually distinct from the 3D scene behind it.

**Why fixed px sizes (not vw/vh / Tailwind responsive):** Browser zoom changes the px-to-CSS-px ratio. Fixed `1300×780px` and `minHeight: 280px` keep the card and shadow at the same physical layout regardless of zoom level, matching the fixed-size diorama Canvas. Responsive Tailwind sizes (`5xl`/`7xl`/`8xl`) were replaced with explicit `text-[42px]` etc. for the same reason.

**Why 8-stop shadow:** Distributes darkening gradually across 280px with no hard split. Upper portion stays transparent so the 3D model shows through; lower portion (text region) is dark for readability.

---

## Data Flow

```
User input (click/keyboard)
  → page.tsx state (activeCheckpoint, isFlying, showScene)
  → Props to TopographicTerrain
  → CameraRig useEffect → sets flyStart/flyEnd
  → CameraRig useFrame → lerps camera + lookAt
  → onFlyComplete → page.tsx: isFlying=false, showScene=true
  → SceneMediaViewer mounts (conditional)
  → CheckpointDiorama renders inside second Canvas
  → OrbitingCamera auto-orbits around focus point
```

---

## State Management

All state is React `useState` in `page.tsx` — no external library.

| State | Type | Purpose |
|---|---|---|
| `activeCheckpoint` | `number \| null` | Selected checkpoint (null = intro) |
| `isFlying` | `boolean` | Camera animating — blocks input |
| `showScene` | `boolean` | Scene panel open |
| `visited` | `Set<number>` | Visited checkpoint indices |
| `autoRotate` | `boolean` | OrbitControls auto-rotate |
| `resetCamera` | `number` | Counter — increment triggers intro fly-back |
| `showHelp` | `boolean` | Help popup open |

Ref mirrors prevent stale closures in `useCallback`: `activeCheckpointRef`, `isFlyingRef`, `autoRotateRef`, `lastInteractionRef`.

---

## Rendering Pipeline

### Main Canvas (terrain)
1. `PlaneGeometry` 199×199 → per-vertex height + color baked via `useMemo`
2. `meshStandardMaterial` with `vertexColors` — no runtime shaders
3. Contour `LineSegments` — pre-computed via `useMemo`
4. `Line2` trail — pre-computed, resolution synced to viewport
5. Flag groups — meshes + sprites + lights, animated via `useFrame`
6. `CameraRig` — `useFrame` lerps camera position + lookAt
7. `OrbitControls` — handles drag/zoom when not flying

### Scene Panel Canvas (diorama)
1. Separate `<Canvas>` — only mounts when `showScene` is true
2. `alpha: false` renderer, scene background = `#7a92a8` (top of cyclorama gradient)
3. Heavy fog (`#8a7560`, near 15, far 50) — darkened for eye comfort
4. Studio cyclorama: half-cylinder, vertex-color gradient (darkened peach horizon → atmospheric blue top)
5. Volumetric mist planes (4 transparent circles, slowly rotating)
6. Extended ground plane (CircleGeometry radius 500)
7. Studio lighting: ambient 0.5 + hemisphere + directional 1.6 (shadows, larger frustum) + fill 0.3 + accent
8. Diorama group (no self-rotation)
9. `OrbitingCamera` — `useFrame` orbits camera around focus point
10. Individual elements animate (gears, birds, clouds, flags, campfire, glowing nodes, glowing tree)

---

## Event Flow

```
Click flag / Press 1-8 / Press ←→
  → handleSelect(idx)
  → If switching checkpoints: closes any open scene first (prevents flash)
  → setActiveCheckpoint(idx), setIsFlying(true), autoRotate=false

Flight completes
  → handleFlyComplete()
  → setIsFlying(false), setShowScene(true) [auto-open]
  → NOTE: does NOT set autoRotate=true (removed to avoid GPU competition stutter
    when the SceneMediaViewer Canvas mounts alongside the main terrain Canvas)

Esc / ↓ / Back to Map (scene open)
  → handleCloseScene() / handleClose()
  → setShowScene(false), autoRotate=true   ← re-enables auto-rotate on close
  → OrbitControls target updates to checkpoint [x, y+0.5, z]

Esc again (no scene open)
  → handleEscape()
  → setActiveCheckpoint(null), setResetCamera(n+1), autoRotate=true
  → CameraRig flies to (36, 30, 36) looking at (0, 3, 0)

4s inactivity (no scene open)
  → setInterval → autoRotate = true
```

---

## Build Process

- **Dev:** `npm run dev` (alias for `next dev -p 3000`) — Turbopack bundler, hot reload, SSR
- **Production:** `npm run build` → `npx next build` with `output: "export"` in `next.config.ts` → emits `./out` static directory
- **Standalone:** No build — `download/index.html` is already complete (kept as a parallel reference; no longer the deploy target)
- **Deploy:** Automated via `.github/workflows/deploy.yml` — pushes to `main` trigger `npx next build` (with `NEXT_PUBLIC_BASE_PATH` from `actions/configure-pages`), adds `./out/.nojekyll`, uploads `./out` to GitHub Pages. `public/.nojekyll` also exists in source. The legacy `src/app/api/` route was removed because it broke the static export.

---

## External Dependencies

| Dependency | Role |
|---|---|
| `three` | 3D engine |
| `three/examples/jsm/lines/` | Line2, LineMaterial, LineGeometry (thick lines) |
| `@react-three/fiber` | React renderer for Three.js |
| `@react-three/drei` | OrbitControls |
| `next` | Framework (app router, SSR) |
| `tailwindcss` | CSS utilities |
| Shadcn UI (unused) | 48 scaffold components, not referenced |

---

## Design Patterns

- **Ref-mirrors-state** — React state mirrored into refs for stable `useCallback` references
- **useMemo for geometry** — All expensive geometry computed once, never recomputed
- **Conditional Canvas mounting** — Scene panel Canvas only exists when `showScene` is true
- **Per-config arrays** — `CAMERA_CONFIG[]` and `CHECKPOINTS[]` drive behavior without conditionals
- **Building-block composition** — 24 reusable components composed into 8 dioramas

---

## Performance Considerations

- Terrain init: ~100ms (40,000 vertices, 4 `sampleH` calls each) — runs once via `useMemo([])`
- Shadow map: 2048×2048 with `normalBias: 0.02` — prevents acne without peter-panning
- Diorama Canvas unmounts on close — zero cost when not viewing
- `Line2` resolution must update on resize
- Standalone uses `requestAnimationFrame` loop with early exit when not animating
- Recent micro-optimizations: dead beacon block removed from `TopographicTerrain.tsx`, unused default export removed from `CheckpointDiorama.tsx`, `hash2`/`texHash` deduplicated, redundant `Math.min` calls simplified

---

## Scalability Considerations

- Adding checkpoints: add to `CHECKPOINTS` array, add diorama function, add `CAMERA_CONFIG` entry
- Adding diorama building blocks: add function to `CheckpointDiorama.tsx`, use in any diorama
- `CheckpointDiorama.tsx` (1597 lines) is the main scalability concern — could split per-diorama
- Terrain grid (200×200) could go higher but init time grows quadratically

---

## Areas Intentionally Kept Simple

- No state library (useState + refs sufficient)
- No routing (single page)
- No API/database (scaffold files unused)
- No persistence (in-memory only)
- No testing framework (manual verification)
- Standalone has no build step (just open the file)
