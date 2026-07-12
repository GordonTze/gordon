# Coding Conventions — The Journey

> Standards inferred from existing code. Follow these when writing new code.

---

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Components | PascalCase | `TerrainMesh`, `CheckpointFlags` |
| Functions | camelCase | `sampleH`, `elevationColor`, `handleSelect` |
| Constants | UPPER_SNAKE | `GRID_SIZE`, `WORLD_SIZE`, `TERRAIN_HEIGHT` |
| Config arrays | UPPER_SNAKE | `CAMERA_CONFIG`, `CHECKPOINTS`, `BAND_COLORS` |
| Refs | camelCase + Ref suffix | `isFlyingRef`, `activeCheckpointRef` |
| Files | PascalCase (components), kebab-case (utils) | `TopographicTerrain.tsx`, `terrain-utils.ts` |
| Diorama builders | `Diorama` + number | `Diorama0`, `Diorama1` ... `Diorama7` |

---

## File Organization

- 3D components in `src/components/three/`
- UI/page logic in `src/app/`
- Standalone mirror in `download/index.html` (parallel reference; not the deploy target)
- Documentation in `documents/` (11 files; `README.md` and `screenshots/` live in project ROOT, not in `documents/`)
- One component per file (except `CheckpointDiorama.tsx` which contains all dioramas)
- Deployment config in `.github/workflows/deploy.yml`, `next.config.ts`, `public/.nojekyll`
- No `examples/` folder (removed — unused WebSocket scaffold)
- No `src/app/api/` route (removed — broke static export)

---

## Component Structure

```tsx
// 1. "use client" directive (for R3F components)
// 2. Imports (React, R3F, Three.js, local utils)
// 3. Constants/config at module level
// 4. Sub-components (reusable building blocks)
// 5. Main exported component
```

**R3F component pattern:**
```tsx
function MyComponent({ prop1, prop2 }: Props) {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => expensiveComputation(), []);
  
  useFrame((state, delta) => {
    // Animation logic
  });
  
  return (
    <mesh ref={ref} geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color={...} roughness={0.9} metalness={0.1} emissiveIntensity={0.08} />
    </mesh>
  );
}
```

---

## State Management Conventions

- **useState** for all reactive state
- **useRef** for values needed in callbacks without re-rendering (mirrors of state)
- **useMemo** for expensive computations (geometry, textures, contour points)
- **useCallback** for event handlers passed as props
- **useEffect** for side effects (keyboard listeners, camera fly-to setup)
- **useFrame** for per-frame animation (inside R3F `<Canvas>` only)

**Ref-mirror pattern:**
```tsx
const [isFlying, setIsFlying] = useState(false);
const isFlyingRef = useRef(false);
// Always update both together:
setIsFlying(true); isFlyingRef.current = true;
```

---

## Formatting

- 2-space indentation
- Double quotes for strings in TS
- Single quotes for strings in standalone JS
- No semicolons (TS) / semicolons (standalone JS)
- JSX on single line if short: `<mesh position={[0, 1, 0]} castShadow />`
- JSX on multiple lines if long
- **Use fixed px text sizes** (`text-[42px]`, `text-[13px]`, etc.) for elements that must align with a fixed-size Canvas — NOT Tailwind responsive sizes (`5xl`/`7xl`/`8xl`) which break alignment under browser zoom
- **Use fixed px dimensions** (`width: "1300px"`) for the checkpoint card — NOT vw/vh, which would drift out of sync with the diorama Canvas under browser zoom

---

## Error Handling

- No try/catch in normal flow — fail fast
- Guard against null refs: `if (ref.current) ref.current.rotation.y = ...`
- Guard against SSR: `typeof document !== "undefined"` if needed outside Canvas
- Type assertions with `!` only when certain: `canvas.getContext("2d")!`

---

## Comments

- Explain **why**, not what
- Use `// ───` section dividers for major sections
- Use `// NOTE:` for non-obvious constraints
- No JSDoc unless the function is a public API

---

## Preferred Abstractions

- **Config arrays** over switch statements: `CAMERA_CONFIG[id]` not `switch(id)`
- **Building-block composition** over monolithic functions
- **useMemo** over useEffect+useState for computed values
- **primitive object** for pre-built Three.js objects: `<primitive object={line} />`

---

## Performance Expectations

- Terrain init: < 200ms (40,000 vertices)
- Diorama render: 60fps with ~50 meshes
- Shadow map: 2048×2048 (balance of quality vs memory)
- No per-frame allocations in `useFrame` — reuse vectors, don't create new ones
- Diorama Canvas unmounts when scene panel closes
- **Avoid setting `autoRotate=true` while a second Canvas is mounting** — two Canvases fighting for GPU time causes a visible stutter (this is why `handleFlyComplete` no longer sets autoRotate)

---

## Reusability Guidelines

- Extract a component if it's used 3+ times
- Keep building blocks simple — one visual element per function
- Pass `accent` color through to allow per-checkpoint theming
- Don't hardcode positions that should be parameters
