# Roadmap — The Journey

> Long-term development roadmap. Inferred from repository direction and conversation history.

---

## Completed

- [x] 3D Gaussian heightfield terrain with hillshade, slope, AO, texture
- [x] 22 marching-squares contour lines (cyan, major/minor hierarchy)
- [x] 8 checkpoint flags (reference style: gold, pink, stripes, sprites)
- [x] 4px thick dashed trail (Line2)
- [x] Camera fly-to with elevation-aware positioning
- [x] Auto-open scene panel after flight
- [x] 8 themed clay-style dioramas (Genesis workshop, Discovery overlook+nodes, Challenge fractured path, Growth construction, Apex summit, Transition misty fork, Reinvention convergence garden, Present camp+observatory) — named `Diorama0`–`Diorama7`
- [x] Extended ground plane (radius 500, no background visible)
- [x] Full keyboard: 1-8, arrows, WASD, Space/↑, ↓, Esc, ?
- [x] Help popup (? button)
- [x] Warm taupe scene panel with periwinkle→lavender sign card
- [x] Dark unvisited checkpoints
- [x] OrbitControls target follows checkpoint
- [x] Studio cyclorama background (half-cylinder, peach-to-blue gradient: bottomColor `#8a7560`, topColor `#7a92a8`)
- [x] Atmospheric fog (darkened `#8a7560` for eye comfort)
- [x] Volumetric mist planes
- [x] 8-stop gradual bottom shadow (`minHeight: 280px` — zoom-independent)
- [x] Playfair Display weights 400–900 loaded for `font-black` title
- [x] All 8 checkpoint descriptions finalized
- [x] Documentation (11 files in `documents/`; `README.md` and `screenshots/` in project root)
- [x] Fixed-size checkpoint card (1300×780px) and fixed px sign card text sizes (`13px`/`42px`/`17px`/`15px`)
- [x] Stutter fix (removed `autoRotate=true` from `handleFlyComplete`)
- [x] Flash fix (`handleSelect` only closes scene when switching checkpoints)
- [x] CP1 camera blend tuned to 0.35 toward CP2 (was 0.1)
- [x] Code optimizations (dead beacon block removed, unused default export removed, `hash2`/`texHash` deduplicated, `Math.min` simplified)
- [x] Folder cleanup (`examples/` and `src/app/api/` removed)
- [x] GitHub Pages deployment via `.github/workflows/deploy.yml` (Next.js static export with `output: "export"`)
- [x] Production build verified (`npm run build` emits `./out`)
- [x] Tagged: `v4.0-stable` (latest), `remember-point-123`, `nearlycomplete2.0`, `nearly-ready`, `descriptions-complete`, `description-finished`, `decent-images-restored`, `v3.0-stable`, `v2.0-stable` (latest commit `09c5339`)

---

## Current

- Sync standalone HTML (`download/index.html`) diorama content with Next.js themed dioramas (sign card/shadow/fog/cyclorama done; diorama 3D models still old). NOTE: standalone is no longer the deploy target — GitHub Pages now serves the Next.js static export — but the standalone remains a useful parallel reference build.
- Monitor GitHub Actions deploys for any regressions

---

## Next

- Sync standalone HTML diorama builders with new themed React dioramas
- Split `CheckpointDiorama.tsx` (1597 lines) into per-diorama files
- Add loading state for terrain init (~100ms)
- Remove remaining unused scaffold files (`src/components/ui/`, `src/hooks/`, `src/lib/`)
- Set `typescript.ignoreBuildErrors: false` in `next.config.ts` once scaffold typecheck issues are resolved

---

## Future

- Mobile touch controls for standalone
- localStorage persistence for visited checkpoints
- Ambient sound effects (wind, birds)
- Day/night cycle (animated directional light)
- Particle effects (snow, rain, falling leaves)
- Multi-language support

---

## Stretch Goals

- Real GLB models replacing procedural diorama geometry
- Analytics tracking (which checkpoints visited most)
- Custom ShaderMaterial for terrain (if vertex-color baking becomes limiting)
- WebRTC multiplayer (shared terrain exploration)
- VR mode (WebXR)
