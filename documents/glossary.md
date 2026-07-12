# Glossary — The Journey

> Project terminology. Concise definitions.

---

## Terrain Terms

| Term | Definition |
|---|---|
| **Heightfield** | 2D grid of height values defining terrain elevation. Here: 200×200 grid. |
| **Gaussian bump** | Bell-shaped elevation feature defined by center (nx,ny), sigma (spread), amplitude (height). |
| **Saddle** | Negative-amplitude Gaussian creating a dip between two peaks. |
| **Hillshade** | Shading based on the angle between surface normal and light direction. Simulates sunlight. |
| **Slope shading** | Darkening based on terrain steepness. Steep areas are slightly darker. |
| **Valley AO** | Ambient occlusion approximation for low-lying concave areas (h < 0.35). Darkens valleys. |
| **Edge fade** | Multiplier that fades terrain to zero at map edges (prevents cliffs at borders). |
| **FBM** | Fractional Brownian Motion. Multi-octave noise for fine-scale terrain detail. |
| **Contour line** | Line of constant elevation. Computed via marching squares algorithm. |
| **Major contour** | Every 5th contour line, rendered at higher opacity (0.35 vs 0.15). |
| **Marching squares** | Algorithm that finds where a threshold crosses grid cells, producing line segments. |
| **Vertex-color baking** | Pre-computing shading into vertex colors at init time. No per-frame GPU cost. |
| **Finite-difference normals** | Computing surface normals by sampling height at neighboring points (hL, hR, hD, hU). |

## Rendering Terms

| Term | Definition |
|---|---|
| **R3F** | React Three Fiber. React renderer for Three.js. |
| **Line2** | Three.js addon for rendering thick lines via screen-space shader. Regular `THREE.Line` linewidth is ignored in WebGL. |
| **LineMaterial** | Material used by Line2. Supports `linewidth` (in pixels), `dashed`, `dashSize`, `gapSize`, and `resolution`. |
| **LineSegments** | Three.js geometry type where each pair of vertices forms an independent line segment. Used for contours to avoid artifacts. |
| **PCFSoftShadowMap** | Percentage-Closer Filtering soft shadow map type. Produces smooth shadow edges. |
| **normalBias** | Shadow map bias that shifts sampling along surface normal. Prevents shadow acne without peter-panning. |
| **ACESFilmicToneMapping** | Tone mapping operator that gives a cinematic look. Used on both Canvases. |
| **CanvasTexture** | Three.js texture created from an HTML canvas element. Used for checkpoint number sprites. |
| **Sprite** | Three.js object that always faces the camera. Used for flag number labels. |
| **alpha: false** | WebGL renderer setting that disables transparency. Background color comes from scene.background. |

## Camera Terms

| Term | Definition |
|---|---|
| **Fly-to** | Eased camera animation from one position to another. Uses cubic easing. For CP1 (Genesis), the fly-to target blends `0.35` toward CP2 (vs `0.1` for others) and `zoomDist=6.7` to keep the workshop in frame. |
| **Elevation-aware positioning** | Camera height adjusts based on elevation difference between current and next checkpoint. 3-tier system. |
| **OrbitControls** | drei component for user-controlled camera rotation/zoom via drag/scroll. |
| **Orbit target** | The point OrbitControls rotates around. Updated to follow the active checkpoint. |
| **Auto-rotate** | OrbitControls slowly rotates the camera after 4s of user inactivity (with no scene open) OR immediately when the scene panel closes (`handleClose`/`handleEscape`/`handleCloseScene`). NOT set when the scene opens (removed from `handleFlyComplete` to prevent GPU competition stutter). |
| **Input gating** | Blocking all user input during camera flight via `isFlyingRef`. |
| **Focus point** | The [x, y, z] point the diorama camera orbits around. Per-checkpoint config. |

## Diorama Terms

| Term | Definition |
|---|---|
| **Diorama** | A miniature 3D scene representing a checkpoint's theme. 8 total (Diorama0–Diorama7). |
| **Clay material** | The `Clay` wrapper component: `meshStandardMaterial` with roughness 0.9, metalness 0.1, emissiveIntensity 0.08. Gives a soft clay look. |
| **Building block** | Reusable component (Tree, Bush, Rock, Gear, etc.) used to compose dioramas. 24 total. |
| **Ground disc** | Large circular platform each diorama sits on. Radius 500 so edge is never visible. |
| **Extended ground plane** | Large flat circle (radius 500) that fills the camera view. Prevents background from showing. |
| **CAMERA_CONFIG** | Per-checkpoint array with focus point, orbit radius, camera height, and ground color. Genesis: radius 14.0, others: 9.0. |
| **Self-rotation** | Rotating the entire diorama group. **Disabled** — causes subject drift. Camera orbits instead. |
| **Cyclorama** | Studio photography backdrop: half-cylinder with vertex-color gradient (bottomColor `#8a7560` darkened peach at horizon → topColor `#7a92a8` atmospheric blue at top). Provides seamless background with no hard horizon line. |
| **Fog** | Atmospheric fog (`#8a7560`, near 15, far 50) that blurs distant objects into the cyclorama horizon. Darkened for eye comfort; matches cyclorama bottomColor so there's no visible seam. |
| **Mist planes** | 4 large transparent circles that slowly rotate, adding volumetric atmospheric depth. |

## UI Terms

| Term | Definition |
|---|---|
| **Scene panel** | Fixed-size overlay card (**1300×780px**, zoom-independent) that shows the diorama + checkpoint text. Auto-opens after fly-to. (Previously `92vw × 92vh`, then `1600×1080` — both replaced with fixed px to stay aligned with the diorama Canvas under browser zoom.) |
| **Sign card** | Paper-like card at the top of the scene panel with periwinkle→lavender gradient (`#b8d0dc` → `#c8b0c8`) and navy serif text (`#21355c`). Contains the label, title, and subtitle. **Fixed px text sizes** (not Tailwind responsive): label `text-[13px]` bold (700), title `text-[42px]` black (900), subtitle `text-[17px]` semibold (600) italic, description `text-[15px]`. |
| **Bottom shadow** | 8-stop gradual gradient with `minHeight: 280px` at the bottom of the scene panel. Upper portion transparent (3D model visible), lower portion dark (text readable). Zoom-independent (was previously `60vh`). |
| **Nav rail** | Bottom navigation bar with 8 numbered checkpoint buttons. |
| **Timeline** | Horizontal progress bar inside the scene panel showing all 8 checkpoints. |
| **Visited** | A checkpoint the user has selected at least once. Tracked in a `Set<number>`. |
| **Help popup** | Modal triggered by ? button showing all keyboard shortcuts. |
| **Playfair Display** | The serif font used for sign card text. Weights 400–900 loaded (specifically `weight: ["400","500","600","700","800","900"]`); title uses 900 (black), label uses 700 (bold), subtitle uses 600 (semibold italic). |

## Deployment Terms

| Term | Definition |
|---|---|
| **Static export** | Next.js `output: "export"` mode that emits a static `./out` directory (no Node server required). Used for GitHub Pages. |
| **`deploy.yml`** | GitHub Actions workflow at `.github/workflows/deploy.yml` that builds and deploys on push to `main`. |
| **`.nojekyll`** | Empty file in `public/` (and copied to `./out/` by the workflow) that disables Jekyll processing on GitHub Pages so `_next/` assets are served as-is. |
| **`NEXT_PUBLIC_BASE_PATH`** | Env var set by `actions/configure-pages` so the build knows the GitHub Pages subpath (e.g. `/my-repo`). `next.config.ts` uses it as `basePath`. |
| **Standalone HTML** | `download/index.html` — a parallel reference build of the same 3D experience. No longer the deploy target (GitHub Pages now serves the Next.js static export) but still maintained for parity. |

## Checkpoint Themes

| # | Title | Theme |
|---|---|---|
| 1 | Genesis | Curiosity |
| 2 | Discovery | Learning through leverage |
| 3 | Challenge | Reframing |
| 4 | Growth | Systems Thinking |
| 5 | Apex | Beyond Achievement |
| 6 | Transition | Reflection |
| 7 | Reinvention | Convergence |
| 8 | Present | Endless Curiosity |
