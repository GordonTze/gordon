# Memory — The Journey

> Current working state. Update frequently. Read this before resuming development.

---

## Current Milestone

**v4.0-stable** (latest commit `09c5339`). All 8 checkpoint descriptions finalized, all visual state restored, GitHub Pages deploy workflow in place, production static build verified.

Latest tags: `v4.0-stable`, `remember-point-123`, `nearlycomplete2.0`, `nearly-ready`, `descriptions-complete`, `description-finished`, `decent-images-restored`, `v3.0-stable`, `v2.0-stable`.

---

## Current Priorities

1. ~~Deploy to GitHub Pages~~ — Done (GitHub Actions workflow deploys Next.js static export)
2. ~~Test production build~~ — Done (`next build` with `output: "export"` works)
3. Sync standalone HTML (`download/index.html`) diorama content with Next.js version (sign card/shadow/fog/cyclorama done, diorama 3D models still old)
4. Split `CheckpointDiorama.tsx` into per-diorama files

---

## Active Work

Nothing in progress. Codebase is at a stable stopping point.

---

## Recently Completed

- **Environment reset recovery** — git history was wiped between sessions, all recent commits/tags lost. Re-applied all session work from scratch.
- **Sign card redesign** — periwinkle→lavender diagonal gradient (`#b8d0dc` → `#c8b0c8`) with navy serif text (`#21355c`). Fixed px text sizes: label `text-[13px]`, title `text-[42px]`, subtitle `text-[17px]`, description `text-[15px]` (no Tailwind responsive sizes).
- **Checkpoint UI card fixed size** — `1300×780px` (was vw/vh based, then 1600×1080). Now zoom-independent.
- **Label centering fix** — `padding-left` (now `pl-[0.3em]`) compensates for trailing `letter-spacing` so the label is visually centered with equal left/right margins.
- **Playfair Display weights 400–900** loaded in layout.tsx (`weight: ["400","500","600","700","800","900"]`) and Google Fonts link (for `font-black` title).
- **Fog darkened** — `#c9a88a` → `#8a7560` (~30% luminance reduction) for eye comfort. Cyclorama horizon (bottomColor) darkened to match.
- **Studio cyclorama** — half-cylinder vertex-color gradient (darkened peach `#8a7560` at horizon → atmospheric blue `#7a92a8` at top).
- **Volumetric mist planes** — 4 transparent circles, slowly rotating, for atmospheric depth.
- **Bottom shadow gradient** — 8-stop gradual gradient with `minHeight: 280px` (was 60vh; now zoom-independent): `0/0.15/0.35/0.55/0.72/0.85/0.93/0.97` at stops `0/10/22/36/50/65/82/100%`.
- **8 themed clay dioramas** fully remade (24 building blocks): Genesis workshop, Discovery overlook+nodes, Challenge fractured path, Growth construction, Apex summit, Transition misty fork, Reinvention convergence garden, Present camp+observatory. Named `Diorama0`–`Diorama7`.
- **All 8 checkpoint descriptions rewritten** by the user.
- **Zoomed-out cameras** — Genesis radius 14.0, others 9.0 (was 3.0-4.8). Camera CP1 blend=0.35 toward CP2 (was 0.1); zoomDist=6.7 (unchanged).
- **Stutter fix** — removed `autoRotate=true` from `handleFlyComplete` to prevent GPU competition during SceneMediaViewer Canvas mount.
- **Flash fix** — `handleSelect` now only closes the scene when switching checkpoints (not when reopening the same one).
- **Auto-rotate behavior** — `autoRotate` is set to `true` when the scene CLOSES (`handleClose`, `handleEscape`, `handleCloseScene`), NOT when it opens.
- **GitHub Pages deployment** — `.github/workflows/deploy.yml` workflow added; `next.config.ts` uses `output: "export"`; `public/.nojekyll` exists; API route removed (broke static export).
- **Build script simplified** — `"build": "next build"` (no standalone copy steps).
- **Optimizations applied** — dead beacon block removed from `TopographicTerrain.tsx`; unused default export removed from `CheckpointDiorama.tsx`; `hash2`/`texHash` deduplicated; `Math.min` simplified.
- **Folder cleanup** — `examples/` folder removed (was unused WebSocket scaffold); `src/app/api/` route removed (broke static export).
- **README.md and `screenshots/`** moved to project ROOT (no longer in `documents/`).

---

## Known Issues

- **Standalone HTML diorama content** — sign card, shadow, fog, cyclorama, and cameras are updated in `download/index.html`, but the diorama 3D model builders (buildGenesis, buildDiscovery, etc.) are still the OLD versions. The Next.js version has the new themed dioramas; the standalone does not. This is a known sync gap.
- **Standalone is no longer the deploy target** — GitHub Pages now deploys the Next.js static export (via `.github/workflows/deploy.yml`), not `download/index.html`. The standalone remains as a parallel reference build.

---

## Technical Debt

- `CheckpointDiorama.tsx` is 1597 lines — should split per-diorama
- 48 unused shadcn UI components in `src/components/ui/`
- Unused scaffold: `src/lib/db.ts`, `src/hooks/` (`examples/` folder was removed — WebSocket chat demo not related to the project; `src/app/api/` route removed because it broke static export)
- Standalone HTML diorama builders not synced with Next.js themed dioramas
- No automated tests (manual verification only)

---

## TODO List

- [x] Deploy to GitHub Pages (Next.js static export via GitHub Actions)
- [x] Test `npm run build` (`output: "export"` works)
- [x] Remove `examples/` folder and `src/app/api/` route (broke static export)
- [ ] Sync standalone HTML diorama content with Next.js themed dioramas
- [ ] Split CheckpointDiorama.tsx
- [ ] Add mobile touch controls for standalone
- [ ] Add localStorage persistence
- [ ] Add loading state for terrain init (~100ms)
- [ ] Remove remaining unused scaffold files (`src/lib/db.ts`, `src/hooks/`)

---

## Next Recommended Tasks

1. Sync standalone HTML diorama builders to match the new themed React dioramas
2. Split `CheckpointDiorama.tsx` (1597 lines) into per-diorama files
3. Remove remaining unused scaffold files (`src/lib/db.ts`, `src/hooks/`)
4. Add a brief loading indicator while terrain initializes

---

## Git Tags (Checkpoints)

| Tag | Description |
|-----|-------------|
| `v4.0-stable` | Latest stable (Next.js static-export deploy pipeline) |
| `remember-point-123` | Working checkpoint before v4.0 |
| `nearlycomplete2.0` | Near-complete milestone (2.0 series) |
| `nearly-ready` | Pre-release candidate |
| `descriptions-complete` | All 8 descriptions + visual state |
| `description-finished` | All 8 descriptions done (earlier) |
| `decent-images-restored` | Visual state restored after reset |
| `v3.0-stable` | Earlier stable version |
| `v2.0-stable` | Earliest stable version |

**Latest commit:** `09c5339`

---

## Unresolved Questions

- Should diorama viewer support manual orbit (drag) alongside auto-orbit?
- Should visited checkpoints persist via localStorage?
- Should there be ambient sound?
- Should the standalone use ES modules or a bundler?
