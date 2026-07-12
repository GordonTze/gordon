# Testing — The Journey

> Testing philosophy and checklists. No automated framework — manual verification only.

---

## Testing Strategy

This project has no automated tests. All verification is manual. The terrain init is deterministic (same heights every time), so manual testing is reliable. Adding a test framework (Jest/Playwright) is a future goal but not currently prioritized.

**Two test targets:**
1. **Next.js dev server** — `npm run dev` at `http://localhost:3000`
2. **Standalone HTML** — open `download/index.html` directly (parallel reference build; no longer the deploy target — GitHub Pages now serves the Next.js static export)

Both must pass all checklists.

---

## Manual Testing Checklist

### Page Load
- [ ] HTTP 200 response
- [ ] Title: "The Journey — An Interactive Topographic Journey"
- [ ] Header visible: tag, h1 "The Journey", description
- [ ] Nav rail visible: 8 numbered buttons (all dark/unvisited)
- [ ] ? button visible bottom-right
- [ ] 3D canvas fills viewport
- [ ] Terrain renders with pastel colors
- [ | Hillshade visible (lit/shadowed sides)
- [ ] Contour lines visible (cyan)
- [ ] Dashed trail visible (4px, cyan)
- [ ] 8 checkpoint flags visible

### Checkpoint Interaction
- [ ] Click flag 1 → camera flies to it
- [ ] Scene panel auto-opens on arrival (no visible stutter — `handleFlyComplete` does NOT set autoRotate)
- [ ] Diorama renders (Genesis: workshop with gears)
- [ ] Camera auto-orbits the diorama
- [ ] Checkpoint card is exactly 1300×780px (regardless of browser zoom)
- [ ] Sign card visible at top center (periwinkle→lavender gradient)
- [ ] Label "CHECKPOINT 1 / 8 · CURIOSITY" visible in navy serif (`text-[13px]`, centered with `pl-[0.3em]`)
- [ ] Title "Genesis" visible in navy serif, black weight (900), `text-[42px]`
- [ ] Subtitle "Everything starts small." visible in navy serif, semibold italic, `text-[17px]`
- [ ] Description visible, `text-[15px]` reading width max 780px
- [ ] Cyclorama background visible (peach horizon `#8a7560` → blue top `#7a92a8`, no hard horizon line)
- [ ] Fog visible (darkened peach `#8a7560`, distant objects fade seamlessly)
- [ ] Mist planes slowly rotating
- [ ] Description text visible at bottom
- [ ] Bottom shadow gradient smooth (no hard split, `minHeight: 280px`, 3D model visible up top)
- [ ] Timeline shows checkpoint 1 as active
- [ ] Press Esc → panel closes, auto-rotate re-enables
- [ ] Camera stays at checkpoint 1 (doesn't jump)
- [ ] Orbit around checkpoint 1 works (drag)
- [ ] Press Esc again → camera flies to intro view
- [ ] Click the SAME active checkpoint (or press its number) again → NO flash (scene stays open)
- [ ] Click a DIFFERENT checkpoint while scene is open → scene closes then reopens for new checkpoint
- [ ] Nav rail shows checkpoint 1 as visited (cyan)

### Keyboard Navigation
- [ ] Press 1 → flies to checkpoint 1
- [ ] Press 2 → flies to checkpoint 2
- [ ] Press 8 → flies to checkpoint 8
- [ ] Press → → flies to next checkpoint
- [ ] Press ← → flies to previous checkpoint
- [ ] Press D → same as →
- [ ] Press A → same as ←
- [ ] Press Space → opens scene panel
- [ ] Press ↑ → same as Space
- [ ] Press W → same as Space
- [ ] Press ↓ → closes scene panel
- [ ] Press S → same as ↓
- [ ] Press Esc → closes panel, then resets to intro
- [ ] Press ? → toggles help popup
- [ ] Input blocked during flight (pressing keys does nothing)

### Visual Quality
- [ ] No shadow acne on terrain
- [ ] No peter-panning (shadows detached from objects)
- [ ] Contour lines sit on terrain surface (not floating)
- [ ] Trail follows terrain contours
- [ ] Flags don't intersect terrain
- [ ] Diorama shadows render correctly
- [ ] No background visible in diorama (cyclorama fills view)
- [ ] Fog blends seamlessly with cyclorama horizon (no seam)
- [ ] Sign card text readable (navy on periwinkle→lavender gradient)
- [ ] Title renders at true black weight (900) — not falling back to lighter
- [ ] Label is visually centered (equal left/right margins to card edges)
- [ ] Bottom shadow has no hard split lines (`minHeight: 280px`)
- [ ] 3D model visible through upper portion of shadow
- [ ] Unvisited checkpoints are dark/dim
- [ ] Visited checkpoints are colored
- [ ] Active checkpoint has accent background
- [ ] **Browser zoom test:** change zoom to 67%, 100%, 150% — card stays 1300×780, sign card text sizes stay fixed (no drift relative to diorama)
- [ ] CP1 (Genesis) workshop stays centered during orbit (blend=0.35)

### Auto-rotate
- [ ] After 4s of no interaction (with no scene open), camera auto-rotates
- [ ] Any mouse/touch/wheel interaction stops auto-rotate
- [ ] Auto-rotate doesn't happen when scene panel is open
- [ ] When the scene panel CLOSES (Esc / ↓ / Back to Map), auto-rotate re-enables immediately
- [ ] When the scene panel OPENS (after fly-to), there is no stutter (autoRotate is NOT set in `handleFlyComplete`)

### Standalone-Specific
- [ ] `download/index.html` opens in browser without server
- [ ] Three.js loads from CDN
- [ ] All 8 dioramas render
- [ ] Keyboard shortcuts work
- [ ] Help popup works
- [ ] Flag animations work (flutter, beacon pulse)

---

## Regression Checklist

After any code change, verify:
- [ ] All 8 checkpoints selectable
- [ ] All 8 dioramas render
- [ ] Camera fly-to works for all checkpoints
- [ ] No console errors
- [ ] TypeScript compiles (`npx tsc --noEmit --skipLibCheck`)
- [ ] Standalone JS syntax valid
- [ ] Both Next.js and standalone behave identically

---

## Critical Functionality

These are the most important features to verify:
1. **Terrain renders** — if terrain doesn't show, nothing else matters
2. **Checkpoint click → fly → panel opens** — the core interaction loop (no stutter on open, no flash on re-select)
3. **Esc closes panel → camera stays at checkpoint** — common bug area
4. **`npm run build` succeeds and emits `./out`** — the GitHub Pages deploy artifact
5. **Standalone works** — `download/index.html` still useful as a parallel reference (no longer the deploy target)

---

## Known Fragile Systems

| System | Why fragile | What breaks it |
|---|---|---|
| `document.createElement` in R3F | SSR crashes if called outside `<Canvas>` | Moving sprite creation out of `useMemo` |
| Line2 resolution | Line width breaks on resize | Not updating `resolution` in resize handler |
| OrbitControls target | Camera jumps if target wrong | Hardcoding `[0, y, 0]` instead of `[x, y, z]` |
| Diorama self-rotation | Subject drifts off-center | Adding `group.rotation.y += delta * 0.1` |
| `toWorld()` height | Double-multiply if not careful | Doing `w[1] * TERRAIN_HEIGHT` when `w[1]` already includes it |
| Fog/cyclorama color mismatch | Visible seam between fog and horizon | Changing fog color without matching cyclorama bottomColor (`#8a7560`) |
| Playfair weight 900 missing | Title renders lighter than expected | Forgetting to add `"900"` to layout.tsx Playfair_Display weights |
| Label off-center | Text shifted left in card | Missing `pl-[0.3em]` to compensate for `letter-spacing` |
| Shadow hard split | Visible line in bottom gradient | Using too few gradient stops or large alpha jump between stops; or using `60vh` instead of `minHeight: 280px` |
| Stutter on scene open | Two Canvases compete for GPU | Setting `autoRotate=true` in `handleFlyComplete` (removed) — autoRotate should only be set on scene CLOSE |
| Flash on re-select | Scene closes then reopens | `handleSelect` closing the scene even when `idx === activeCheckpointRef.current` (fixed) |
| CP1 workshop drift | Genesis camera target blend too small | Using `blend = 0.1` for CP1 instead of `0.35` |
| Sign card text drift under zoom | Tailwind responsive sizes scale with zoom | Using `5xl`/`7xl`/`8xl` instead of fixed px (`text-[42px]` etc.) |
| Card size drift under zoom | vw/vh scale with zoom | Using `92vw × 92vh` or `1600×1080` instead of fixed `1300×780` |
| Static export breaks | API routes require a server | Adding a route under `src/app/api/` while `output: "export"` is set |

---

## Testing Commands

```bash
# Typecheck
npx tsc --noEmit --skipLibCheck

# Standalone JS syntax
node -e "const fs=require('fs');const h=fs.readFileSync('download/index.html','utf8');const m=h.match(/<script type=\"module\">([\s\S]*?)<\/script>/);new Function(m[1].replace(/^\s*import\s+.*$/gm,''));console.log('OK')"

# Start dev server
npm run dev

# Production build test (static export → ./out)
npm run build

# Check HTTP response
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000
```

---

## Performance Testing

- Open Chrome DevTools → Performance tab
- Record 10 seconds of interaction (click checkpoint, view diorama, close)
- Check: 60fps target, no long tasks > 50ms
- Terrain init should complete in < 200ms
- Shadow map should not cause stuttering

---

## Areas Lacking Test Coverage

- No automated unit tests
- No integration tests
- No visual regression tests
- No mobile device testing (manual only)
- No cross-browser testing (Chrome assumed)
- No accessibility testing
- No performance benchmarks
