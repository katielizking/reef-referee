## Goal

Turn the 3D tank from a procedural preview into an editable scene. Users can select any object, move it (with type-aware rules), rotate/resize plants and décor, duplicate or delete it, and undo/redo — with a compact side panel on desktop and a bottom sheet on mobile.

## What changes for the user

- Click/tap any fish, plant, rock, wood, leaf litter or equipment → selection outline appears.
- Drag on the scene floor to move; on mobile, one-finger drag on the selected object.
- Right-hand "Selected" panel (desktop) / bottom sheet (mobile) shows:
  - Name and type
  - Position (X / Z, plus Y for driftwood and floating plants)
  - Rotation (Y axis; free axis for driftwood)
  - Size (0.5×–1.6× of natural)
  - Duplicate · Remove buttons
- Undo/Redo buttons in the scene toolbar (⌘Z / ⌘⇧Z on desktop).

## Placement rules the scene enforces

| Type | Movement | Y (vertical) | Rotate | Resize |
|---|---|---|---|---|
| Fish | X/Z inside usable water; Y inside its swim-zone band | auto by zone, small manual nudge | – | – |
| Rooted plant | X/Z inside footprint | sits on substrate | Y | yes |
| Floating plant | X/Z inside footprint | locked to water surface | Y | yes |
| Rock / cave | X/Z inside footprint | sits on substrate (base rests on slab) | Y | yes |
| Driftwood | X/Z inside footprint, Y within tank | free X/Y/Z rotation | free | yes |
| Equipment (filter, heater) | snaps to nearest back/side glass | Y within tank | – | – |
| Substrate | not selectable (slab as today) | – | – | – |

All objects are clamped to stay fully inside the glass every frame based on an approximate bounding radius.

## Data model changes

Move from "row + quantity + hashed positions" to per-instance placements while keeping catalog rows intact.

New `TankState` fields (client-only for now):
```
placements: Array<{
  id: string;               // uuid, stable across edits
  kind: "fish" | "plant" | "hardscape" | "equipment";
  refId: string;            // species/plant/hardscape/filter id
  pos: [x, y, z];           // scene units
  rot: [x, y, z];           // radians
  scale: number;            // 0.5..1.6
}>
```

Migration path:
- Adding a species/plant/hardscape row expands into N placements at hashed positions (same look as today for untouched tanks).
- The old `species/plants/hardscape` arrays stay as the source of truth for scoring and Supabase persistence; placements are derived on load and rewritten on save.

Persistence:
- Add `placements JSONB` column to `tanks` (nullable). On save we serialise the array; on load we hydrate. Existing tanks with `NULL` fall back to procedural placement.
- Quantity on the catalog rows is recomputed from `placements.filter(kind==="…" && refId===…).length` before writing tank_species / tank_plants / tank_hardscape so scoring stays intact.

Equipment:
- Add a lightweight `EquipmentKind` union (`"filter" | "heater"`) rendered as a simple back-glass box. Placement uses `kind: "equipment"`. Adding a filter in the setup panel auto-creates one equipment placement on the back wall; removing the filter removes it.

## Interaction implementation

Libraries already installed: `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`. No new deps required — drei ships `<PivotControls>` and `<Html>` which we use for gizmos and the selection halo, plus a small custom drag-plane handler for mobile-friendly single-touch drag.

- Selection: raycast on pointerdown; `selectedId` in a small zustand store to avoid re-rendering the whole scene on hover.
- Outline: a slightly enlarged wireframe copy of the mesh, tinted with the brand accent, toggled by `selected`.
- Drag (desktop + mobile): pointer events on the object project onto an invisible plane whose orientation matches the object's constraint (XZ plane for substrate objects, YZ or XY for back-glass equipment, water-surface plane for floating plants). Constrained clamp runs each move.
- Rotate / resize: desktop uses a compact numeric-plus-slider control in the side panel (no 3D handles → works identically on mobile). Only the Y-rotation slider is shown for most types; driftwood exposes X/Y/Z rotation.
- Undo/redo: a bounded (50-entry) history ring of `TankState` snapshots kept in the same zustand store; keyboard shortcuts on desktop, buttons in the scene toolbar. Snapshots are pushed on commit (pointerup, slider release, add/remove/duplicate), never during continuous drag.

## UI additions

- `SceneToolbar` above the canvas: Undo, Redo, "Reset layout" (recomputes procedural positions).
- `SelectedObjectPanel` (desktop, replaces the current "here's what's happening" info card while something is selected).
- `SelectedObjectSheet` (mobile, shadcn Sheet from bottom).
- Empty-state remains the same when nothing is selected.

## Files

New:
- `src/components/tank3d/placements.ts` — types, ID helpers, procedural expansion, constraint clamp per kind.
- `src/components/tank3d/editorStore.ts` — zustand store: `selectedId`, `hoverId`, undo/redo stack, commit helpers.
- `src/components/tank3d/SelectionOutline.tsx` — wireframe halo primitive.
- `src/components/tank3d/DragHandler.tsx` — pointer→plane projection with per-kind clamp.
- `src/components/tank3d/EquipmentMesh.tsx` — back/side-glass equipment rendering.
- `src/components/tank3d/SelectedObjectPanel.tsx` and `SelectedObjectSheet.tsx`.
- `src/components/tank3d/SceneToolbar.tsx`.

Modified:
- `TankScene.tsx` — iterate `state.placements` instead of grouped rows; wire selection, drag, outline, toolbar.
- `FishMesh.tsx`, `PlantMesh.tsx`, `HardscapeMesh.tsx` — accept a single placement + `selected` and drop the internal position generator (moved to `placements.ts`).
- `src/lib/types.ts` — add `PlacementRow` and `placements` on `TankState` + `TankRow`.
- `src/lib/data.ts` — save/load placements JSON; regenerate quantities from placements.
- `src/routes/index.tsx` and `src/routes/t.$slug.tsx` — hydrate placements on load; shared view remains read-only (`interactive={false}` disables drag/gizmos but keeps selection info hidden).
- Supabase migration: `alter table public.tanks add column placements jsonb;` — no RLS change, no grant change.

## Scoring impact

None. Scoring reads the grouped `species/plants/hardscape` arrays, which we keep in sync with placements before scoring runs.

## Out of scope for this pass

- Snap-to-grid, alignment guides, group selection, copy/paste between tanks.
- Persisting per-fish position (fish are still animated; drag sets their "home" anchor and school centre, and the swim animation orbits from there).
- Equipment catalog beyond filter and a single generic heater placeholder.
