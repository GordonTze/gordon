# Development Workflows — The Journey

> How to build, run, test, debug, and deploy.

---

## Project Setup

```bash
# Clone
git clone <repo-url>
cd my-project

# Install
npm install

# Verify
npx tsc --noEmit --skipLibCheck  # Should output nothing
```

**Checklist:**
- [ ] Node.js 18+ installed
- [ ] `npm install` completed without errors
- [ ] TypeScript typecheck passes
- [ ] `download/index.html` opens in browser

---

## Build

```bash
# Development (hot reload)
npm run dev

# Production (static export → ./out)
npm run build

# Start production server (only valid for non-export builds; not used for GitHub Pages)
npm run start
```

`npm run build` is an alias for `next build`. With `output: "export"` set in `next.config.ts`, this emits the static site into `./out` (no Node server needed). The build script was simplified to plain `next build` — no standalone copy steps.

**Checklist:**
- [ ] No TypeScript errors
- [ ] No build warnings
- [ ] Page loads at `http://localhost:3000`
- [ ] `./out/` directory is created with `index.html` and `_next/` assets
- [ ] Title is "The Journey — An Interactive Topographic Journey"

---

## Run

```bash
# Dev server
npm run dev   # alias for: next dev -p 3000

# Standalone (no server needed — parallel reference build)
open download/index.html
```

**Checklist:**
- [ ] Terrain renders with pastel colors
- [ ] 8 checkpoint flags visible
- [ ] Dashed trail connects checkpoints
- [ ] Auto-rotate works after 4s
- [ ] Clicking a flag flies camera there
- [ ] Scene panel auto-opens on arrival
- [ ] Diorama renders and orbits
- [ ] Esc closes panel, Esc again resets

---

## Debug

### Common issues and fixes:

| Symptom | Cause | Fix |
|---|---|---|
| Scene not rendering | SSR crash from `document.createElement` | Move to `useMemo` inside `<Canvas>` |
| Scene not rendering | Drei `<Line>` crash | Use manual `Line2` construction |
| Flags/contours missing | `document.createElement` in render phase | Move to `useMemo` |
| Camera jumps on panel close | OrbitControls target at (0,3,0) | Update target to checkpoint `[x, y, z]` |
| Contour lines floating | Double `TERRAIN_HEIGHT` multiply | Use `toWorld()` result directly |
| Subject drifts during orbit | Diorama self-rotation | Remove `group.rotation.y += delta * 0.1` |
| Trail is 1px thick | `LineDashedMaterial.linewidth` ignored | Use `Line2`/`LineMaterial` |
| Background visible | Ground plane too small or alpha:true | Radius 500 + `alpha: false` + scene bg |
| Stutter when scene panel opens | Two Canvases fighting for GPU (autoRotate was set in `handleFlyComplete`) | Don't set `autoRotate=true` in `handleFlyComplete`; only set it on scene close |
| Flash when re-selecting active checkpoint | `handleSelect` always closed the scene | Only close when switching checkpoints |
| CP1 workshop drifts off-center | Camera target blend too small (0.1) | Use `blend = 0.35` for CP1 (Genesis) |
| `next build` fails with API route error | API routes don't work with `output: "export"` | Remove `src/app/api/` route |
| Sign card text drifts under browser zoom | Tailwind responsive sizes (`5xl`/`7xl`/`8xl`) | Use fixed px (`text-[42px]`, etc.) |
| "Sandbox is inactive" | Preview environment issue | Click restart button |

### Debug checklist:
- [ ] Check browser console for errors
- [ ] Check `npx tsc --noEmit --skipLibCheck` passes
- [ ] Check standalone JS syntax: `node -e "new Function(js)"`
- [ ] Clear `.next` cache: `rm -rf .next`
- [ ] Kill stale dev servers: `pkill -f "next dev"`

---

## Test

No automated test framework. Manual testing only.

### Manual test checklist:
- [ ] Page loads (HTTP 200)
- [ ] Title correct
- [ ] Terrain renders (pastel colors, hillshade visible)
- [ ] Contour lines visible (cyan, major/minor)
- [ ] Dashed trail visible (4px, cyan)
- [ ] 8 flags visible (gold finials, pink flags, numbers)
- [ ] Click flag → camera flies → panel opens
- [ ] Diorama renders and auto-orbits
- [ ] Title/subtitle/description visible over diorama
- [ ] Timeline shows visited/unvisited correctly
- [ ] Press 1-8 → flies to checkpoint
- [ ] Press ←→ → navigates checkpoints
- [ ] Press Space/↑ → opens panel
- [ ] Press ↓/Esc → closes panel
- [ ] Press Esc again → resets to intro
- [ ] Press ? → help popup
- [ ] Drag → orbits camera
- [ ] Scroll → zooms
- [ ] Auto-rotate after 4s inactivity
- [ ] Standalone `download/index.html` works in browser

### Regression checklist (after changes):
- [ ] All 8 dioramas still render
- [ ] Camera fly-to still works
- [ ] Keyboard shortcuts still work
- [ ] Shadows render correctly (no acne, no peter-panning)
- [ ] Standalone matches Next.js behavior

---

## Lint

```bash
npm run lint
```

**Checklist:**
- [ ] No lint errors
- [ ] No unused imports (except scaffold files)

---

## Deploy

### GitHub Pages (automated — Next.js static export):

Deployment is fully automated via `.github/workflows/deploy.yml`:

1. Push to `main` (or trigger `workflow_dispatch` manually)
2. The workflow runs:
   - `actions/checkout@v4`
   - `actions/setup-node@v4` (Node 24)
   - `actions/configure-pages@v5` (sets `NEXT_PUBLIC_BASE_PATH` for project pages)
   - `npm install --legacy-peer-deps`
   - `npx next build` (uses `output: "export"` → emits `./out`)
   - `touch ./out/.nojekyll` (also `public/.nojekyll` exists in source)
   - `actions/upload-pages-artifact@v3` (uploads `./out`)
3. The `deploy` job publishes the artifact to GitHub Pages

No manual steps required for routine deploys.

### Standalone HTML (manual, legacy):
```bash
# The standalone build is no longer the deploy target but is kept as a parallel reference.
# To deploy it manually to a separate GitHub Pages repo:
cp download/index.html /path/to/gh-pages-repo/index.html
cd /path/to/gh-pages-repo
git add index.html
git commit -m "deploy: update standalone"
git push
```

### Vercel/Netlify (Next.js, alternative):
```bash
npm run build
# Deploy via platform CLI or git integration
# NOTE: remove `output: "export"` from next.config.ts first if you want SSR/API routes
```

**Checklist:**
- [ ] Production build succeeds (`npm run build` emits `./out`)
- [ ] `./out/.nojekyll` exists
- [ ] Standalone opens in browser without server
- [ ] All features work in production
- [ ] No console errors
- [ ] `NEXT_PUBLIC_BASE_PATH` correctly set for the GitHub Pages subpath

---

## Typical Feature Workflow

1. Read `agent.md` and `memory.md`
2. Make changes in Next.js source (`src/`)
3. Typecheck: `npx tsc --noEmit --skipLibCheck`
4. Test in dev server: `npm run dev`
5. Mirror changes in `download/index.html` (parallel reference build)
6. Validate standalone JS syntax
7. Update `memory.md`
8. Commit with descriptive message
9. Push to `main` → GitHub Actions auto-deploys to GitHub Pages

---

## Typical Bug Fix Workflow

1. Reproduce the bug
2. Check `documents/decisions.md` — was this intentional?
3. Check browser console for errors
4. Fix in Next.js source
5. Typecheck
6. Test in dev server
7. Mirror fix in standalone
8. Update `memory.md` (move from "Known Issues" to "Recently Completed")
9. Commit

---

## Typical Refactor Workflow

1. Read `architecture.md` to understand the system
2. Read `decisions.md` to understand why it's structured this way
3. Make the refactor
4. Run full manual test checklist
5. Update `architecture.md` if structure changed
6. Update `conventions.md` if patterns changed
7. Commit

---

## Documentation Update Workflow

1. Update the relevant document(s)
2. Keep entries concise — reasoning over implementation
3. Update `memory.md` last (it's the most volatile)
4. Commit: `docs: update <filename>`

---

## Git Workflow

```bash
# Save stable version
git tag -a <name> -m "description"

# Return to a saved checkpoint
git checkout v4.0-stable  # or other tag

# List all saved checkpoints
git tag

# Branch for feature work
git checkout -b feature/new-diorama

# Merge back
git checkout main
git merge feature/new-diorama
```

**Current tags:** `decent-images-restored`, `description-finished`, `descriptions-complete`, `nearly-ready`, `nearlycomplete2.0`, `remember-point-123`, `v2.0-stable`, `v3.0-stable`, `v4.0-stable` (latest stable: `v4.0-stable`, latest commit: `09c5339`).

**Commit message format:**
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code restructure
- `docs:` documentation
- `style:` visual/CSS only
- `chore:` cleanup/maintenance
