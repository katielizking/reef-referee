# Replace 2D TankVisual with a 3D scene driven by TankState

Add a WebGL aquarium built with React Three Fiber that reads directly from the existing `TankState` — no parallel store, no toy add-buttons. The current SVG `TankVisual` is removed; the 3D scene takes its place on the builder (`/`) and shared view (`/t/$slug`).

## Dependencies

```
bun add three @react-three/fiber@^9 @react-three/drei zustand
bun add -d @types/three
```

`zustand` is pulled in only because a couple of drei helpers list it as a peer; we do not create a new store.

## Files

- `src/components/tank3d/TankScene.tsx` — new. `<Canvas>` + lighting + `OrbitControls` + `<Aquarium>`. Props: `{ state: TankState }`. Camera distance derived from the largest tank dimension.
- `src/components/tank3d/Aquarium.tsx` — new. Renders glass box, substrate slab, water tint, and maps `state.species / plants / hardscape` to meshes. Uses the existing axes: `length_cm` = X (width on screen), `height_cm` = Y, `width_cm` = Z (depth). Scale: 10 cm = 1 scene unit.
- `src/components/tank3d/FishMesh.tsx` — new. Procedural fish (body / tail / fin / eyes) with the gentle swim animation from the snippet. Colour derived from the species row (see below); size scaled from `species.adult_size_cm`, clamped to fit the tank. Shoaling species (`is_schooling` / `min_group_size`) rendered as a cluster with per-fish phase + offset so they move as a school. Vertical band anchored by `swim_zone` (top / mid / bottom).
- `src/components/tank3d/PlantMesh.tsx` — new. Procedural stems at substrate level with a subtle sway; count driven by the plant row's quantity, position jittered deterministically by row id + index.
- `src/components/tank3d/HardscapeMesh.tsx` — new. Dodecahedron rocks / cylinder driftwood / flat leaf-litter discs picked by `hardscape.type`, placed on the substrate.
- `src/components/tank3d/palette.ts` — new. Small helpers: species → colour (biotope-based fallback with a deterministic hue-per-id nudge so different species look different), substrate colour from `hardscape` (sand / gravel / soil) with a neutral default.
- `src/components/tank3d/ClientOnlyCanvas.tsx` — new. Wraps `TankScene` in `<ClientOnly>` + `React.lazy` so `three` / `@react-three/fiber` never load during SSR. See TanStack execution model rules in project knowledge.
- `src/components/TankVisual.tsx` — deleted. Every import site swaps to the new component.
- `src/routes/index.tsx` and `src/routes/t.$slug.tsx` — swap `<TankVisual state={state} />` for `<ClientOnlyCanvas state={state} />`. Wrap the scene in a fixed-aspect container so layout stays stable during hydration.

## Interaction

- Click a fish mesh → selects that species row. A thin lime ring appears under every fish of that group, and the corresponding `<li>` in `TankSetupPanel` gets a matching highlight.
- Selection state lives locally in `TankScene` (`useState<string | null>` keyed by species id). No changes to `TankState`.
- "Remove" is handled by the existing setup panel's stepper — a small floating chip in the scene ("Rainbowfish ×6 — remove") calls the same removal path that the panel already uses via a callback prop `onRemoveSpecies(id)` exposed by `index.tsx`.
- No drag-to-reposition in this pass. Positions are deterministic from the row id so the scene doesn't jump on every re-render.
- Camera: `OrbitControls` with rotate + zoom enabled, pan disabled, distance clamped to the tank size.

## Adult-size scaling and schooling

- Each fish mesh is scaled so its long axis matches `adult_size_cm` in scene units, then clamped to at most 40% of the tank's shortest dimension so a hopelessly-oversized species still renders but looks visibly cramped. This is a visual cue only; the scorecard still owns the actual judgement.
- Schoolers (`is_schooling === true`) are laid out on a jittered grid sized to `quantity`; each fish gets its own phase so the school drifts rather than moving as one rigid block. Non-schoolers are spaced individually across their swim zone.

## SSR and performance

- `<ClientOnlyCanvas>` gates the entire three.js import graph behind hydration — static route imports must not pull `three` in.
- `dpr={[1, 1.75]}`, shadows off in v1, `frameloop="demand"` when nothing is animating (fall back to `"always"` when at least one fish is present).
- Reduced-motion: when `prefers-reduced-motion: reduce`, `useFrame` early-returns so fish and plants sit still.
- Shared view (`/t/$slug`) uses the same component; users on very small screens still see it, but the ClientOnly boundary shows a lightweight "Loading preview" panel until the WebGL bundle is ready.

## Out of scope for this pass

- Drag-and-drop repositioning, saved custom positions, GLB models, water caustics / physics, mobile static fallback image. Called out here so we can sequence them next.

## Verification

- Build passes; `three` does not appear in the SSR chunk (spot-check the build output).
- Playwright pass on `/`: after adding 6 rainbowfish + a plant + a rock, screenshot shows a school in the mid zone, plant on the substrate, and a rock; clicking a fish flashes the selection ring; the scorecard on the right is unchanged.
- `/t/$slug` renders the same scene read-only (no interaction changes required — clicking is a no-op because the setup panel isn't present).
