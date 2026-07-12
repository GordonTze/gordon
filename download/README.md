# The Road Through Numbers — An Interactive 3D Journey

A standalone, dependency-free interactive 3D experience where a silhouette traveler walks along a topographic trail of mathematical awakening. Click any glowing waypoint to fly the camera there and read a rich story page about that chapter of the journey.

Built with **Three.js**. Runs on **GitHub Pages with zero build step**.

## What's inside

One file — `index.html` (~32 KB) — containing:

- **Topographic terrain** rendered with a custom GLSL shader (procedural elevation + contour lines + paper grain + vignette)
- **Winding glowing trail** connecting 5 waypoints (Catmull-Rom interpolation through the points)
- **Silhouette character** with walk-cycle animation that walks the trail toward the active waypoint
- **5 floating math-themed 3D shapes** above the waypoints:
  - ∞ Infinity (awakening)
  - d/dx Derivative (calculus)
  - ε-δ Limit (analysis)
  - Torus (topology)
  - Fractal cube cluster (synthesis)
- **Click-to-fly camera** with eased cubic interpolation (~1.5s)
- **Full-screen warm editorial overlay** with rich bio content for each waypoint
- **18 decorative floating math symbols** scattered across the map (wireframe tori, tetrahedra, octahedra, icosahedra)
- **Warm editorial palette**: parchment background, sepia contours, amber accents
- **Playfair Display + Inter + JetBrains Mono** typography (loaded from Google Fonts)

## Interaction

- **Click any waypoint** on the map → camera flies there, character walks the trail, overlay opens after ~1.4s
- **Drag** to orbit · **Scroll** to zoom
- **← →** arrow keys to navigate between scenes (when overlay is open)
- **Esc** to close the overlay and return to the map
- **Bottom rail** — click any chapter to jump there directly

## Waypoints (placeholder content — edit freely)

| # | Year   | Title                  | Math Concept                          |
|---|--------|------------------------|---------------------------------------|
| 1 | Year 0 | The First Spark        | Foundations · Number Sense            |
| 2 | Year 4 | The Calculus of Motion | Differential Calculus · Rates of Change |
| 3 | Year 7 | The Rigor of Analysis  | Real Analysis · ε-δ Reasoning         |
| 4 | Year 10| The Shape of Space     | Topology · Manifolds                  |
| 5 | Year 14| The Synthesis          | Synthesis · Fractals · Dynamical Systems |

Each waypoint has: year, title, subtitle, math concept label, quote, and 3 long-form bio paragraphs (150+ words each).

## How to customize

Open `index.html` in any text editor. Search for the `WAYPOINTS` array near the top of the `<script type="module">` block. Each entry looks like:

```js
{
  id: 'awakening',                         // unique slug
  year: 'Year 0',                          // shown in pill
  title: 'The First Spark',                // large heading
  subtitle: 'Where numbers became more...',// italic subheading
  mathShape: 'infinity',                   // which 3D shape (see below)
  mathConcept: 'Foundations · Number Sense',
  quote: '"The child sees infinity..."',
  accent: '#C97B3B',                       // hex color
  bio: [
    "Paragraph 1...",
    "Paragraph 2...",
    "Paragraph 3..."
  ]
}
```

### Available `mathShape` values

`integral` · `derivative` · `limit` · `torus` · `mobius` · `klein` · `sum` · `infinity` · `matrix` · `fractal` · `gradient`

### Adding a new waypoint

Just append a new object to the `WAYPOINTS` array — the trail, character path, camera, and UI all auto-layout based on the array length. No other code changes needed.

### Changing the visual style

- **Background color**: edit `scene.background = new THREE.Color('#E8DCC4')`
- **Fog color**: edit `scene.fog = new THREE.Fog('#E8DCC4', 18, 45)`
- **Terrain palette**: edit the `TERRAIN_FRAG` shader (search for `parchment`, `deepSepia`, `highlight`)
- **Trail color**: edit `new THREE.LineBasicMaterial({ color: 0xC97B3B, ...})`
- **Camera start position**: edit `camera.position.set(0, 12, 18)`

## Deploy to GitHub Pages (3 ways)

### Option A — Web UI upload (fastest)

1. Create a new public repo on github.com (e.g. `math-journey`).
2. **Add file → Upload files** → drag `index.html`.
3. Commit.
4. **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
5. Visit `https://YOUR-USERNAME.github.io/math-journey/` after ~30s.

### Option B — Git CLI

```bash
git clone https://github.com/YOUR-USERNAME/math-journey.git
cd math-journey
cp /path/to/index.html .
git add index.html
git commit -m "Add interactive journey"
git push origin main
```
Then enable Pages in repo Settings.

### Option C — User/organization site (root domain)

For `https://YOUR-USERNAME.github.io/`:
1. Create a repo named exactly `YOUR-USERNAME.github.io`.
2. Push `index.html` to `main`.
3. Pages is auto-enabled.

## Why no build step?

- Three.js loads from **jsDelivr CDN** via ES module `importmap`.
- Fonts load from **Google Fonts** CDN.
- No bundler, no Node, no npm install, no compilation.
- Just one HTML file — works on any static host.

## Browser support

Chrome / Edge 89+, Firefox 108+, Safari 16.4+. WebGL 2.0 required.

## License

MIT.
