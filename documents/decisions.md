# Engineering Decisions — The Journey

> Historical log of significant decisions. Prevents re-litigating settled questions.

---

## 2026-06-26

### Full project rebuild from conversation context

**Reason:** Repository was externally reset between sessions, wiping all commits. Only an older scaffold remained.

**Alternatives:**
- Start completely new project
- Try to recover lost commits (no remote, no reflog)

**Tradeoffs:**
+ Full context from conversation history
+ Could rebuild exactly what was lost
- Time-consuming (~4,500 lines)
- Risk of subtle differences

**Status:** Current. Rebuilt and tagged `v4.0-stable` (latest commit `09c5339`). Earlier tags include `descriptions-complete`, `description-finished`, `decent-images-restored`, `nearly-ready`, `nearlycomplete2.0`, `remember-point-123`, `v3.0-stable`, `v2.0-stable`.

---

### Vertex-color baked terrain shading

**Reason:** Terrain is static. Baking hillshade + slope + AO + texture into vertex colors means zero per-frame GPU cost.

**Alternatives:**
- Custom ShaderMaterial with runtime hillshade
- Three.js built-in lighting on the mesh
- Heightmap texture + normal map

**Tradeoffs:**
+ No per-frame cost
+ Works with standard `meshStandardMaterial`
- Can't change at runtime without rebuilding geometry
- Limited to grid resolution for detail

**Status:** Current. Reversible.

---

### Manual finite-difference normals (not computeVertexNormals)

**Reason:** `computeVertexNormals()` averages face normals — smoother but less detailed. Finite differences give sharper hillshade matching the reference.

**Alternatives:**
- `geo.computeVertexNormals()` (simpler)
- Analytic normals from Gaussian derivatives

**Tradeoffs:**
+ Sharper, more detailed hillshade
+ Matches reference exactly
- More code per vertex
- 4 extra `sampleH()` calls per vertex at init

**Status:** Current.

---

### Line2 for thick dashed trail

**Reason:** WebGL ignores `linewidth` on `THREE.Line`/`LineDashedMaterial` — all lines render at 1px. `Line2` uses screen-space shader for true pixel-width.

**Alternatives:**
- `LineDashedMaterial` with `linewidth` (doesn't work)
- drei `<Line>` component (caused SSR crash)
- Tube geometry (overkill, no dashes)

**Tradeoffs:**
+ Real 4px thick dashed line
+ `dashSize`/`gapSize` work correctly
- Requires imports from `three/examples/jsm/lines/`
- Must update `resolution` on resize

**Status:** Current. Not easily reversible.

---

### No diorama self-rotation

**Reason:** Rotating the diorama group while camera also orbited caused the workshop at (0, _, 0.6) to swing around the origin, drifting to ~20% horizontal (far left) instead of staying at 50%.

**Alternatives:**
- Rotate diorama + track focus point (complex)
- Only rotate individual elements (current approach)

**Tradeoffs:**
+ Subject stays centered
+ Individual animations still work (gears, birds, flags)
- Diorama feels slightly less "alive"
- Can't show object backs without camera orbit

**Status:** Current. Reversible.

---

### OrbitControls target follows checkpoint

**Reason:** Closing scene panel re-enabled OrbitControls, but target was still at intro (0, 3, 0). Camera jumped to map center.

**Alternatives:**
- Hardcode target to (0, 3, 0) and accept jump
- Separate orbit target state in CameraRig

**Tradeoffs:**
+ Camera stays at checkpoint after closing panel
+ Smooth orbit around checkpoint
- Must compute via `useMemo` in page.tsx
- Initial bug: X/Z hardcoded to 0 (fixed)

**Status:** Current.

---

### Auto-open scene panel after flight

**Reason:** Previously required second action after camera arrived. Felt clunky.

**Alternatives:**
- Manual open (Space/click after flight)
- Auto-open with delay (laggy)

**Tradeoffs:**
+ Seamless: click → fly → panel opens
- Can't preview terrain before panel opens
- Two-step escape (Esc closes panel, Esc again resets)

**Status:** Current.

---

### Per-checkpoint zoom (Genesis: radius 14.0, others: 9.0) and CP1 camera blend

**Reason:** Genesis has large workshop + background scatter. Default zoom (9.0) was too tight. All cameras zoomed out significantly from the original 3.0-4.8 to see entire 3D models. Additionally, the CP1 (Genesis) camera target blends 0.35 toward CP2 (was 0.1) to prevent the workshop at (0, _, 0.6) from swinging out of frame during orbit. CP1 `zoomDist=6.7` (unchanged).

**Alternatives:**
- Zoom out all checkpoints equally (too far for simpler dioramas)
- Per-diorama radius in CAMERA_CONFIG (current approach)
- Keep CP1 blend at 0.1 (workshop drifted off-center)

**Tradeoffs:**
+ Genesis shows more context
+ Others stay framed
+ CP1 workshop stays centered during orbit
- Genesis is a special case with larger radius (14.0 vs 9.0) and a custom blend (0.35 vs 0.1)

**Status:** Current. Reversible.

---

### Warm taupe scene panel background

**Reason:** Dark navy felt cold and suffocating. Warm taupe matches clay aesthetic.

**Alternatives:**
- Keep dark navy
- Pure black (too harsh)
- Light cream (clashes with 3D)

**Tradeoffs:**
+ Warmer, more inviting
+ Blends with clay materials
- Less contrast with dark scenes

**Status:** Current. (Note: the sign card now uses a periwinkle→lavender gradient card on top of this background — see "Sign card gradient" decision below.)

---

### Extended ground plane (radius 500) + alpha:false

**Reason:** Diorama ground disc (radius 4-20) didn't fill camera view. CSS background showed through.

**Alternatives:**
- Larger diorama disc (wastes geometry)
- Fog to hide edge
- Just alpha:false + scene background

**Tradeoffs:**
+ Background never visible
+ Simple geometry
- Camera far plane must be 1000

**Status:** Current.

---

### Canvas-texture number sprites for flags

**Reason:** Reference design used canvas-drawn numbers. Matches exactly, lightweight.

**Alternatives:**
- `TextGeometry` (requires font loading, heavy)
- Flat circles (no number)
- HTML overlay (doesn't work in 3D)

**Tradeoffs:**
+ Exact match to reference
+ Lightweight (128×128, created once)
- `document.createElement` must be in `useMemo` inside `<Canvas>` — SSR crash otherwise

**Status:** Current. SSR crash was fixed.

---

### Dark unvisited checkpoints

**Reason:** All buttons looked the same brightness. Hard to track progress.

**Alternatives:**
- Hide unvisited (too restrictive)
- Greyscale (washes out design)

**Tradeoffs:**
+ Clear progression: dark → colored → active
+ Users can see what's ahead
- Unvisited are quite dim

**Status:** Current.

---

### Dual-target: Next.js + standalone HTML

**Reason:** Next.js for development (hot reload, TypeScript). Standalone for GitHub Pages (no build step).

**Alternatives:**
- Only Next.js (can't deploy to static host easily)
- Only standalone (no TypeScript, no hot reload)
- Export Next.js as static (possible but complex config)

**Tradeoffs:**
+ Best of both worlds
+ Standalone works anywhere
- Must maintain both in sync
- ~2x code surface area

**Status:** Current. Not reversible without losing either DX or deployability.

---

## 2026-07-01 (session: sign card + fog + cyclorama + shadow)

### Sign card: periwinkle→lavender gradient with navy serif text

**Reason:** The old approach (white text with multi-layer text-shadow over the 3D scene) was hard to read when the background was bright. A dedicated paper-like card with its own gradient background and navy serif text is more legible and visually distinct.

**Implementation:**
- Card background: `linear-gradient(135deg, #b8d0dc 0%, #c8b0c8 100%)` (periwinkle top-left → lavender bottom-right)
- Text color: `#21355c` (navy) for label and title, `#2e4674` (lighter navy) for subtitle
- Font: Playfair Display serif, weight 700 (label), 900 (title), 600 (subtitle italic)
- **Fixed px text sizes** (not Tailwind responsive): label `text-[13px]`, title `text-[42px]`, subtitle `text-[17px]`, description `text-[15px]`. Keeps layout zoom-independent (matches the fixed 1300×780 checkpoint card).
- Label has `pl-[0.3em]` to compensate for trailing `letter-spacing` (centering fix)

**Alternatives:**
- Keep text-shadow approach (hard to read over bright 3D scenes)
- Solid color card (less interesting)
- Glass morphism (too trendy)
- Tailwind responsive sizes `5xl`/`7xl`/`8xl` (zoom-dependent — rejected after card moved to fixed px)

**Tradeoffs:**
+ Much more legible
+ Visually distinct from 3D scene
+ Matches the "fibrous paper" reference aesthetic
+ Zoom-independent (matches the fixed-size card)
- Requires Playfair Display weight 900 to be loaded
- Card is opaque (blocks 3D content behind it)

**Status:** Current.

---

### Darkened fog (#8a7560) for eye comfort

**Reason:** The original fog color `#c9a88a` (bright muted peach) was too bright and harsh on the eyes.

**Implementation:** Darkened to `#8a7560` (~30% luminance reduction). The cyclorama's horizon (bottom) color was darkened by the same amount so the fog still blends seamlessly into the horizon — no visible seam between faded objects and the backdrop. The cyclorama is a half-cylinder with bottomColor `#8a7560` and topColor `#7a92a8`.

**Alternatives:**
- Keep bright fog (too harsh)
- Darken only fog (creates a visible seam with the brighter cyclorama)
- Use a completely different color (breaks the warm aesthetic)

**Tradeoffs:**
+ Easier on the eyes
+ Seamless fog-to-horizon blending preserved
- Slightly moodier atmosphere

**Status:** Current.

---

### Studio cyclorama background

**Reason:** A flat background color created a hard horizon line. A cyclorama (curved backdrop) provides a seamless studio photography look with a smooth gradient from ground to sky.

**Implementation:** Half-cylinder (radius 80, height 60) with vertex-color gradient: darkened peach (`#8a7560`) at the horizon → atmospheric blue (`#7a92a8`) at the top. The bottom 15% blends the ground color into the peach.

**Alternatives:**
- Flat background color (hard horizon)
- Skybox texture (overkill for this aesthetic)
- Gradient shader (more complex)

**Tradeoffs:**
+ Seamless studio look
+ No hard horizon line
+ Ground blends naturally at the base
- Extra geometry (one half-cylinder)
- Must darken with fog to stay matched

**Status:** Current.

---

### Bottom shadow: 8-stop gradual gradient (minHeight 280px)

**Reason:** The original 3-stop gradient had a hard split at 35%. Multiple iterations found that an 8-stop gradient distributing darkening across a fixed `minHeight: 280px` provides readability without obscuring the 3D model. The change from `60vh` to `280px` was made so the shadow height stays constant regardless of browser zoom (matches the fixed-size 1300×780 checkpoint card).

**Implementation:** `linear-gradient(180deg, rgba(31,28,24,0) 0%, rgba(31,28,24,0.15) 10%, rgba(31,28,24,0.35) 22%, rgba(31,28,24,0.55) 36%, rgba(31,28,24,0.72) 50%, rgba(31,28,24,0.85) 65%, rgba(31,28,24,0.93) 82%, rgba(29,25,21,0.97) 100%)` with `minHeight: 280px` and `display: flex; flex-direction: column; justify-content: flex-end`.

**Alternatives:**
- 3-stop with kink at 35% (hard split — rejected)
- 6-stop (too few, visible transitions)
- 10-stop (too many, hard to tune)
- `60vh` height (zoom-dependent — rejected after the card moved to fixed px)

**Tradeoffs:**
+ No hard split lines
+ Upper portion transparent (3D model visible)
+ Lower portion dark (text readable)
+ Content pinned to bottom via flexbox
+ Zoom-independent (matches fixed-size card)
- More complex than a 3-stop gradient

**Status:** Current.

---

### Playfair Display weight 900 loaded

**Reason:** The title uses Tailwind's `font-black` class (font-weight: 900). Playfair Display must actually ship weight 900 or the browser silently falls back to a lighter weight, defeating the "thicker" title effect.

**Implementation:** Added `"900"` to the `weight` array in `layout.tsx`'s `Playfair_Display` config (now `weight: ["400", "500", "600", "700", "800", "900"]`), and added `0,900;1,600;1,700` to the Google Fonts `<link>` in the standalone HTML.

**Alternatives:**
- Use weight 800 (close but not as bold)
- Use a different font that includes 900 by default

**Tradeoffs:**
+ Title renders at true black weight
+ Matches the "thicker and larger" design intent
- Slightly larger font payload

**Status:** Current.

---

## 2026-07-03 (session: deploy pipeline + UX fixes + cleanup)

### GitHub Pages deployment via Next.js static export

**Reason:** Originally the plan was to deploy the standalone `download/index.html` to GitHub Pages (no build step). But maintaining two render paths is costly, and Next.js can produce a static export via `output: "export"`. This lets us deploy the canonical Next.js version directly.

**Implementation:**
- `next.config.ts` sets `output: "export"`, `images.unoptimized: true`, `transpilePackages: ["three"]`, `basePath: process.env.NEXT_PUBLIC_BASE_PATH || ""`
- `.github/workflows/deploy.yml` runs on push to `main`: checkout → setup Node 24 → `actions/configure-pages` (sets `NEXT_PUBLIC_BASE_PATH`) → `npm install --legacy-peer-deps` → `npx next build` → `touch ./out/.nojekyll` → upload `./out` to GitHub Pages
- `public/.nojekyll` also committed in source
- Build script simplified to `"build": "next build"` (no standalone copy steps)
- Removed `src/app/api/` route (broke static export — API routes require a server)

**Alternatives:**
- Keep deploying `download/index.html` (two code paths to maintain)
- Use Vercel (great DX but ties the project to a platform)
- Use `next start` with a Node server (not static, needs hosting)

**Tradeoffs:**
+ Single source of truth (Next.js)
+ Automatic deploys on push to main
+ basePath auto-configured for project pages
+ `download/index.html` still works as a parallel reference build
- Static export means no API routes, no SSR
- `typescript.ignoreBuildErrors: true` currently set (workaround for typecheck-blocking scaffold files)

**Status:** Current. Live on GitHub Pages.

---

### Fixed-size checkpoint card (1300×780px) and fixed px text sizes

**Reason:** The original card used `92vw × 92vh` and the sign card used Tailwind responsive sizes (`5xl`/`7xl`/`8xl`). When the user changed browser zoom, the card grew/shrunk but the diorama Canvas (which has its own fixed internal resolution) didn't, so the sign card text drifted out of alignment with the 3D scene. A second attempt at `1600×1080` was too large for typical laptop screens.

**Implementation:**
- Card: `style={{ width: "1300px", height: "780px", ... }}` (not vw/vh, not 1600×1080)
- Sign card text: `text-[13px]` (label), `text-[42px]` (title), `text-[17px]` (subtitle), `text-[15px]` (description) — explicit px, no Tailwind responsive classes
- Bottom shadow: `minHeight: "280px"` (was `60vh`)

**Alternatives:**
- `92vw × 92vh` (zoom-dependent — rejected)
- `1600×1080` (too large for laptop screens — rejected)
- Tailwind responsive sizes `5xl`/`7xl`/`8xl` (zoom-dependent — rejected)

**Tradeoffs:**
+ Layout identical at every browser zoom level
+ Sign card text aligns with diorama elements consistently
+ Reasonable size on common laptop screens (1300×780 fits within 1366×768 with margins)
- On very small / very large screens the card is the same size (no responsiveness)
- Scrollbars may appear on screens narrower than 1300px

**Status:** Current.

---

### Stutter fix: removed autoRotate=true from handleFlyComplete

**Reason:** When the camera flight completed and the scene panel auto-opened, both Canvases (main terrain + SceneMediaViewer diorama) were active simultaneously for a brief moment. Setting `autoRotate=true` in `handleFlyComplete` made the hidden main terrain Canvas keep rendering frames in parallel with the new diorama Canvas mount, causing a visible stutter.

**Implementation:** Removed the `autoRotateRef.current = true; setAutoRotate(true);` lines from `handleFlyComplete`. Added a comment explaining why. Auto-rotate is now re-enabled when the scene CLOSES (in `handleClose`, `handleEscape`, and `handleCloseScene`) or after 4s of inactivity with no scene open.

**Alternatives:**
- Pause the main Canvas entirely while the scene is open (more invasive)
- Throttle the main Canvas frame loop (complex)
- Keep autoRotate=true and accept the stutter (rejected)

**Tradeoffs:**
+ No visible stutter when the scene panel opens
+ Auto-rotate still resumes when the user closes the scene
- One-frame delay between scene-close and auto-rotate resuming (imperceptible)

**Status:** Current.

---

### Flash fix: handleSelect only closes scene when switching checkpoints

**Reason:** If the user clicked the same checkpoint again while its panel was open (or pressed its number key), the old code would close the scene and immediately re-open it, producing a visible flash. The new code only closes the scene when switching to a different checkpoint.

**Implementation:** `handleSelect` checks `activeCheckpointRef.current === idx` before deciding whether to close the existing scene. If the same checkpoint is re-selected, the scene stays open (no-op).

**Alternatives:**
- Always close + reopen (causes flash — rejected)
- Disable input for the active checkpoint while its panel is open (confusing UX)

**Tradeoffs:**
+ No visible flash when re-selecting the active checkpoint
- Re-selecting the active checkpoint is now a no-op (no "refresh" behavior)

**Status:** Current.

---

### Folder cleanup: removed examples/ and src/app/api/

**Reason:** Both were unused and one was actively harmful:
- `examples/` was an unused WebSocket chat scaffold from the original template, unrelated to the project
- `src/app/api/route.ts` broke `next build` with `output: "export"` because API routes require a Node server

**Implementation:** Deleted both directories. No other code referenced them.

**Alternatives:**
- Keep `examples/` (dead weight)
- Keep `src/app/api/` and don't use static export (loses GitHub Pages deploy)

**Tradeoffs:**
+ Clean repo
+ Static export works
- None

**Status:** Current.
