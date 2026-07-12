# READ THIS FILE FIRST.

> Primary onboarding document for AI agents. Read this before making any changes.

---

## Project Summary

**The Journey** is an interactive 3D topographic terrain website. Users explore a pastel-colored Gaussian heightfield with 8 checkpoints connected by a thick dashed trail. Each checkpoint represents a stage in a personal growth narrative (Genesis → Present). Clicking a checkpoint triggers an eased camera fly-to, then auto-opens a near-fullscreen scene panel with a handcrafted clay-style 3D diorama.

A standalone vanilla Three.js mirror (`download/index.html`) is maintained in parallel for GitHub Pages deployment.

---

## Current Project Status

**Stable** — Latest commit `09c5339`; latest stable tag `v4.0-stable`. All features verified working:
- TypeScript compiles clean
- Standalone JS syntax valid
- Dev server returns HTTP 200
- All 8 dioramas render correctly
- All 8 checkpoint descriptions finalized
- Full keyboard/mouse/touch support
- GitHub Pages deploy via `.github/workflows/deploy.yml` (Next.js static export)

**Recent session work** (restored after environment reset):
- Sign card: periwinkle→lavender gradient with navy serif text, fixed px text sizes
- Bottom shadow: 8-stop gradual gradient (minHeight 280px, zoom-independent)
- Checkpoint UI card: fixed 1300×780px (zoom-independent, no vw/vh)
- Darkened fog (#8a7560) for eye comfort
- Studio cyclorama background (half-cylinder, peach-to-blue gradient)
- 8 themed clay dioramas fully remade (Diorama0–Diorama7)
- All 8 checkpoint descriptions rewritten
- Playfair Display weights 400–900 loaded (weight 900 for `font-black` title)
- Stutter fix: removed `autoRotate=true` from `handleFlyComplete`
- Flash fix: `handleSelect` only closes scene when switching checkpoints
- Camera CP1: blend=0.35 toward CP2 (was 0.1), zoomDist=6.7
- Optimizations: dead beacon block removed, unused default export removed, hash2/texHash deduplicated, Math.min simplified

---

## Main Goals

1. **Visual polish** — Pastel clay aesthetic with hillshade, contour lines, soft shadows
2. **Smooth UX** — Camera fly-to, auto-open panels, full keyboard navigation
3. **Dual-target** — Next.js for development, standalone HTML for GitHub Pages
4. **Performance** — Vertex-color baked terrain shading, no runtime shaders
5. **Continuity** — Every feature mirrored exactly between Next.js and standalone

---

## Design Philosophy

1. **Mirror everything** — Next.js and standalone must stay in sync
2. **No diorama self-rotation** — Camera orbits; diorama stays still (rotating both caused drift)
3. **Vertex-color baking** — Terrain shading baked at init, not per-frame
4. **Per-checkpoint camera config** — Each diorama has own focus/radius/height/groundColor
5. **Extended ground plane** — Radius 500 + `alpha: false` + scene background = ground color
6. **Input gating** — All input blocked during camera flight (`isFlyingRef`)
7. **Ref-mirrors-state** — React state mirrored into refs to avoid stale closures

---

## Coding Philosophy

- **TypeScript** for Next.js; **vanilla JS** for standalone
- **R3F JSX** — `rotation` on `<mesh>`, NOT on `<geometry>`
- **Clay materials** — High roughness (0.85-0.95), low metalness, subtle emissive
- **Shadows** — `castShadow`/`receiveShadow` on all solid meshes; `normalBias: 0.02`
- **Minimal abstraction** — Only abstract what's reused 3+ times
- **Explain why** — Comments explain reasoning, not what the code does

---

## Repository Overview

```
src/components/three/
├── terrain-utils.ts         # Heightfield, checkpoints, elevation colors (140 lines)
├── TopographicTerrain.tsx   # Terrain mesh, contours, trail, flags, camera rig (435 lines)
├── CheckpointDiorama.tsx    # 24 building blocks + 8 dioramas (1597 lines)
└── SceneMediaViewer.tsx     # Diorama viewer: cyclorama, fog, camera config (178 lines)

src/app/
├── page.tsx                 # Main UI, state, keyboard, scene panel, sign card (293 lines)
└── layout.tsx               # Root layout, metadata, fonts (Playfair 400-900) (46 lines)

download/
└── index.html               # Standalone vanilla Three.js mirror (2181 lines)

documents/                   # This folder — 11 documentation files

(root)
├── README.md                # Human-facing overview (in project root, not documents/)
├── screenshots/             # Screenshot images (in project root)
├── .github/workflows/deploy.yml  # GitHub Pages deploy workflow
├── next.config.ts           # output: "export" for static GitHub Pages
└── public/.nojekyll         # Disables Jekyll on GitHub Pages
```

---

## Technology Stack

| Tech | Why |
|---|---|
| Next.js 16 | App router, SSR, Turbopack, fast refresh |
| React Three Fiber | Declarative Three.js in React, hooks for frame loop |
| Three.js 0.184 | 3D rendering, Line2 for thick lines, PCFSoftShadowMap |
| drei | OrbitControls |
| Tailwind CSS 4 | Utility-first styling for DOM overlays |
| Line2/LineMaterial | Thick dashed trail (WebGL ignores `linewidth` on regular lines) |

---

## Important Constraints

1. **Never rotate the diorama group** — only the camera orbits
2. **`document.createElement` must be inside `useMemo` within `<Canvas>`** — SSR crashes otherwise
3. **`rotation` goes on `<mesh>`, not on `<geometry>`** — TypeScript will error
4. **`LineDashedMaterial.linewidth` is ignored in WebGL** — use `Line2`
5. **`toWorld()` already multiplies by `TERRAIN_HEIGHT`** — don't double-multiply
6. **Standalone must stay in sync** — every change applies to both versions
7. **OrbitControls target must use full `[x, y, z]`** — not `[0, y, 0]`
8. **Sign card uses periwinkle→lavender gradient** (`#b8d0dc` → `#c8b0c8`) with navy serif text (`#21355c`) — not the old text-shadow approach
9. **Sign card text sizes are fixed px** — label `text-[13px]`, title `text-[42px]`, subtitle `text-[17px]`, description `text-[15px]` (no Tailwind responsive sizes — keeps layout zoom-independent)
10. **Checkpoint UI card is fixed 1300×780px** — uses `width: "1300px", height: "780px"` (not vw/vh, not 1600×1080) so it stays the same size regardless of browser zoom
11. **Bottom shadow uses `minHeight: 280px`** — not `60vh` or `35%` (zoom-independent)
12. **Fog color must match cyclorama horizon** — both use `#8a7560` (darkened) so distant objects fade seamlessly. Cyclorama is a half-cylinder with bottomColor `#8a7560` and topColor `#7a92a8`.
13. **Playfair Display weights 400–900 must be loaded** — the title uses `font-black` (weight 900); layout.tsx loads `weight: ["400", "500", "600", "700", "800", "900"]`
14. **Auto-rotate is set to `true` when the scene CLOSES** — `handleClose`, `handleEscape`, and `handleCloseScene` all set `autoRotate=true`. `handleFlyComplete` does NOT set it (removed to prevent GPU competition stutter when the SceneMediaViewer Canvas mounts).
15. **`handleSelect` only closes the scene when switching checkpoints** — reopening the same checkpoint while its panel is open does not close-and-reopen (prevents a visible flash).

---

## Common Commands

```bash
npm run dev                     # Start dev server (next dev -p 3000)
npx tsc --noEmit --skipLibCheck # Typecheck
npm run build                   # Production build (next build → ./out via output:"export")
git checkout v4.0-stable        # Return to latest stable tag
git tag                         # List all saved checkpoints
```

**Deployment** is automated via `.github/workflows/deploy.yml`:
- Triggers on push to `main` (or manual run)
- Runs `npx next build` with `NEXT_PUBLIC_BASE_PATH` set by `actions/configure-pages`
- Adds `./out/.nojekyll` (also `public/.nojekyll` exists in source)
- Uploads `./out` to GitHub Pages

---

## Documentation Map

| Document | When to read |
|---|---|
| `agent.md` (this file) | **First** — always |
| `memory.md` | **Second** — current state, TODOs, what's next |
| `architecture.md` | Need to understand system design or data flow |
| `conventions.md` | Writing new code — match existing style |
| `decisions.md` | Wondering "why was this done this way?" |
| `workflows.md` | Need to build, test, debug, or deploy |
| `api.md` | Need to understand public interfaces |
| `roadmap.md` | Planning what to build next |
| `testing.md` | Need to verify functionality |
| `glossary.md` | Encountering unfamiliar terminology |
| `prompts.md` | Reusable AI instructions for common tasks |
| `../README.md` | Human-facing overview in project root (not needed for AI work) |

---

## Current Priorities

1. ~~Deploy to GitHub Pages~~ — Done (GitHub Actions workflow deploys Next.js static export)
2. ~~Test production build~~ — Done (`next build` with `output: "export"` works)
3. Sync standalone HTML (`download/index.html`) diorama content with Next.js version (sign card/shadow/fog/cyclorama done, diorama 3D models still old)
4. Split `CheckpointDiorama.tsx` into per-diorama files

---

## Reading Order

1. **`agent.md`** (this file) — project overview and constraints
2. **`memory.md`** — what's the current state?
3. **`architecture.md`** — how does the system work?
4. **`conventions.md`** — how should I write code?
5. **`decisions.md`** — why were things done this way?
6. **`workflows.md`** — how do I build/test/deploy?
7. **`api.md`** — what are the key interfaces?
8. **`prompts.md`** — reusable instructions for common tasks

**Available git tags (checkpoints):** `decent-images-restored`, `description-finished`, `descriptions-complete`, `nearly-ready`, `nearlycomplete2.0`, `remember-point-123`, `v2.0-stable`, `v3.0-stable`, `v4.0-stable`

**Latest commit:** `09c5339`
