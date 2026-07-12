# AI Prompts — The Journey

> Reusable instructions for future AI agents. Follow these when performing common tasks.

---

## General Guidelines

- **Preserve architecture.** Don't restructure without reading `architecture.md` and `decisions.md`.
- **Avoid unnecessary abstraction.** Only extract if reused 3+ times.
- **Match existing coding style.** Read `conventions.md` before writing code.
- **Prefer consistency over novelty.** Use the same patterns already in the codebase.
- **Update documentation after significant changes.** At minimum, update `memory.md`.
- **Explain reasoning before major refactors.** Document in `decisions.md`.
- **Sync the parallel standalone build.** Next.js changes should be mirrored in `download/index.html` (parallel reference; no longer the deploy target — GitHub Pages serves the Next.js static export).
- **Typecheck after every change.** `npx tsc --noEmit --skipLibCheck`
- **Validate standalone JS.** Run the syntax check command from `workflows.md`.
- **Don't add API routes.** `output: "export"` is set; API routes break the static build.
- **Don't reintroduce `examples/`.** The unused WebSocket scaffold was removed.

---

## Prompt: Adding a Feature

```
Read documents/agent.md and documents/memory.md first.

I want to add: [FEATURE DESCRIPTION]

Steps:
1. Read architecture.md to understand where this fits
2. Read conventions.md for coding style
3. Implement in src/ (Next.js)
4. Typecheck: npx tsc --noEmit --skipLibCheck
5. Test in dev server: npx next dev
6. Mirror in download/index.html
7. Validate standalone JS syntax
8. Run manual test checklist from testing.md
9. Update memory.md with completed work
10. Commit with message: "feat: [description]"

Constraints:
- rotation goes on <mesh>, not <geometry>
- document.createElement must be inside useMemo within <Canvas>
- Use Line2 for thick lines, not LineDashedMaterial
- Don't rotate the diorama group (camera orbits only)
- toWorld() already multiplies by TERRAIN_HEIGHT
- Keep Next.js and standalone in sync (download/index.html is now a parallel reference, not the deploy target — GitHub Pages serves the Next.js static export)
- Sign card: periwinkle→lavender gradient (#b8d0dc → #c8b0c8), navy serif text (#21355c)
- Sign card text sizes are FIXED px (not Tailwind responsive): label text-[13px], title text-[42px], subtitle text-[17px], description text-[15px]
- Checkpoint card is fixed 1300×780px (not vw/vh, not 1600×1080)
- Fog color must match cyclorama horizon (both #8a7560; cyclorama bottomColor #8a7560, topColor #7a92a8)
- Playfair Display weights 400–900 must be loaded in layout.tsx (weight: ["400","500","600","700","800","900"]) for the font-black title
- Bottom shadow: 8-stop gradient, minHeight: 280px (not 60vh), flex column justify-end
- autoRotate is set to true ONLY when the scene CLOSES (handleClose/handleEscape/handleCloseScene) or after 4s idle — never in handleFlyComplete
- handleSelect only closes the scene when switching checkpoints (no flash on re-select)
- CP1 (Genesis) camera target blend = 0.35 toward CP2 (was 0.1); zoomDist=6.7
- No src/app/api/ routes (breaks output:"export"); no examples/ folder (removed)
```

---

## Prompt: Fixing a Bug

```
Read documents/agent.md first.

Bug: [DESCRIPTION OF BUG]

Steps:
1. Check documents/decisions.md — was this behavior intentional?
2. Check documents/testing.md "Known Fragile Systems" table
3. Reproduce in dev server
4. Check browser console for errors
5. Fix in src/ (Next.js)
6. Typecheck
7. Test the fix
8. Mirror fix in download/index.html
9. Validate standalone JS syntax
10. Run regression checklist from testing.md
11. Update memory.md (move from Known Issues to Recently Completed)
12. Commit with message: "fix: [description]"

Common causes:
- SSR crash: document.createElement outside useMemo
- Camera jump: OrbitControls target not following checkpoint
- Subject drift: diorama self-rotation enabled
- 1px lines: using LineDashedMaterial instead of Line2
- Floating contours: double TERRAIN_HEIGHT multiply
- Fog/cyclorama seam: fog color doesn't match cyclorama bottomColor (#8a7560)
- Title not bold enough: Playfair Display weight 900 not loaded
- Label off-center: missing pl-[0.3em] for letter-spacing compensation
- Shadow hard split: too few gradient stops or large alpha jump; or using 60vh instead of minHeight: 280px
- Stutter when scene opens: autoRotate=true was set in handleFlyComplete (removed) — set autoRotate only on scene close
- Flash when re-selecting active checkpoint: handleSelect closed the scene unconditionally (now only closes when switching checkpoints)
- CP1 workshop drifts: camera target blend too small (0.1) — use 0.35 for CP1
- next build fails with API route error: src/app/api/ routes incompatible with output:"export" — remove the route
- Sign card text drifts under browser zoom: Tailwind responsive sizes (5xl/7xl/8xl) — use fixed px (text-[42px] etc.)
- Card size drifts under zoom: 92vw × 92vh or 1600×1080 — use fixed 1300×780
```

---

## Prompt: Refactoring

```
Read documents/architecture.md and documents/decisions.md first.

Refactor target: [WHAT TO REFACTOR AND WHY]

Steps:
1. Understand why the current structure exists (check decisions.md)
2. Verify the refactor won't break the dual-target constraint
3. Make changes incrementally — one file at a time
4. Typecheck after each change
5. Test after each change
6. Mirror in standalone if applicable
7. Run full manual test checklist
8. Update architecture.md if structure changed
9. Update conventions.md if patterns changed
10. Update decisions.md with the refactor decision
11. Commit with message: "refactor: [description]"

Rules:
- Don't change behavior — only structure
- Don't remove comments explaining "why"
- Don't combine multiple refactors in one commit
- If it works, don't fix it — have a concrete reason
```

---

## Prompt: Optimization

```
Read documents/architecture.md "Performance Considerations" section first.

Optimization target: [WHAT TO OPTIMIZE]

Steps:
1. Profile current performance (Chrome DevTools → Performance)
2. Identify the bottleneck
3. Check if the optimization violates any decision in decisions.md
4. Implement the optimization
5. Measure improvement
6. Verify no visual regression
7. Mirror in standalone if applicable
8. Update architecture.md performance section
9. Commit with message: "perf: [description]"

Current known performance characteristics:
- Terrain init: ~100ms (runs once via useMemo)
- Shadow map: 2048×2048 (balance of quality vs memory)
- Diorama Canvas unmounts on close (zero cost when not viewing)
- Vertex colors are baked (no per-frame terrain shading cost)

Don't optimize without measuring first.
```

---

## Prompt: Documentation Update

```
Update the following documentation: [WHICH FILES AND WHY]

Steps:
1. Read the current document
2. Read the relevant source code
3. Update with accurate, concise information
4. Focus on reasoning, not implementation details
5. Don't duplicate what the code already says
6. Keep it skimmable — headings and bullets
7. Commit with message: "docs: update [filename]"

Rules:
- memory.md changes frequently — update after any significant work
- decisions.md only for significant engineering decisions
- architecture.md only when structure changes
- agent.md only when onboarding info changes
- Keep all documents short enough to read in a few minutes
```

---

## Prompt: Code Review

```
Review the following changes: [DIFF OR DESCRIPTION]

Checklist:
- [ ] TypeScript compiles: npx tsc --noEmit --skipLibCheck
- [ ] No SSR-unsafe code (document/window outside Canvas)
- [ ] rotation on <mesh>, not <geometry>
- [ ] Shadows: castShadow/receiveShadow on solid meshes
- [ ] No diorama self-rotation
- [ ] toWorld() result not double-multiplied
- [ ] Line2 used for thick lines (not LineDashedMaterial)
- [ ] OrbitControls target uses [x, y, z] (not [0, y, 0])
- [ ] Sign card: periwinkle→lavender gradient, navy serif text, FIXED px sizes (text-[13px]/text-[42px]/text-[17px]/text-[15px])
- [ ] Checkpoint card fixed at 1300×780px (not vw/vh)
- [ ] Bottom shadow uses minHeight: 280px (not 60vh)
- [ ] Fog color matches cyclorama horizon (both #8a7560; cyclorama bottomColor #8a7560, topColor #7a92a8)
- [ ] Playfair Display weights 400–900 loaded in layout.tsx
- [ ] autoRotate NOT set in handleFlyComplete (set only on scene close in handleClose/handleEscape/handleCloseScene)
- [ ] handleSelect only closes scene when switching checkpoints
- [ ] CP1 (Genesis) camera blend = 0.35 toward CP2; zoomDist=6.7
- [ ] No src/app/api/ routes (breaks output:"export")
- [ ] npm run build emits ./out successfully
- [ ] Standalone download/index.html updated to match (parallel reference)
- [ ] Standalone JS syntax valid
- [ ] No console errors
- [ ] memory.md updated
- [ ] Commit message follows convention (feat/fix/refactor/docs/perf)
```

---

## Prompt: Architecture Review

```
Review the architecture for: [CONCERN OR AREA]

Steps:
1. Read documents/architecture.md
2. Read documents/decisions.md
3. Read the relevant source files
4. Evaluate:
   - Is the architecture still appropriate for the project's complexity?
   - Are there abstractions that are no longer needed?
   - Are there missing abstractions that would reduce duplication?
   - Are the dual-target (Next.js + standalone) sync points clear?
   - Is the state management approach still sufficient?
   - Are there performance concerns at current scale?
5. Document findings
6. If changes needed, follow the "Refactoring" prompt
7. Update architecture.md if structure changes
```

---

## Prompt: Performance Improvement

```
Improve performance for: [SPECIFIC AREA]

Steps:
1. Read documents/architecture.md "Performance Considerations"
2. Read documents/testing.md "Performance Testing"
3. Profile with Chrome DevTools:
   - Performance tab: record 10s of interaction
   - Check for frame drops (< 60fps)
   - Check for long tasks (> 50ms)
   - Check memory leaks (growing heap)
4. Identify top 3 bottlenecks
5. For each bottleneck:
   a. Check if optimization violates decisions.md
   b. Implement
   c. Measure improvement
   d. Verify no visual regression
6. Mirror in standalone if applicable
7. Update architecture.md performance section
8. Commit: "perf: [description]"

Easy wins to check first:
- Reduce GRID_SIZE (200 → 150) — less terrain init time
- Reduce shadow map size (2048 → 1024) — less GPU memory
- Reduce diorama mesh count — fewer draw calls
- Lazy-load CheckpointDiorama.tsx — smaller initial bundle
```
