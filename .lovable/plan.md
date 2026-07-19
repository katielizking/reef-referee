## Goal

Add the new `fishBehaviours.ts` module you pasted and actually use it so fish in the 3D tank move like their species — tetras schooling tightly, kuhlis weaving along the substrate, bettas hovering near the surface, cichlids patrolling, predators darting after long pauses, etc.

## Scope

1. **Create `src/components/tank3d/fishBehaviours.ts`** with the exact contents you pasted (verbatim — the file path in your `bash -lc` command was an external work dir; it needs to land in the project).

2. **Wire the profile into `FishGroup` / `FishMesh` in `src/components/tank3d/FishMesh.tsx`**. Today the swim loop is a single fixed `sin/cos` path with `amp`, `speed`, tail freq `7.5`, roll `0.025`, pectoral freq `5.2` — all hardcoded and identical for every species. Replace with a behaviour-driven loop:
   - Compute `profile = fishBehaviourProfile(species)` once per `FishGroup` (memoised).
   - Derive a shared "school anchor" per group when `schoolingCohesion` is high, and per-instance offsets when it's low, so tight-school species visibly move together and territorial/ambush species don't.
   - Use `rangeX`, `rangeZ`, `verticalRange` to size the swim path against `interior` (replacing the current `amp` constant), still clamped by the existing model-size margins so fish stay inside the glass.
   - Use `cruiseSpeed`, `turnRate`, `tailFrequency`, `tailAmplitude`, `pectoralFrequency`, `bodyRoll`, `maxPitch` to drive the frame updates (replacing the hardcoded `7.5`, `0.025`, `5.2`, and the fixed `delta * 3.1` heading lerp).
   - Layer `burstStrength` (short accelerations, gated by a per-instance phase so predators/danios dart occasionally), `pauseStrength` (periodic slowdowns for bettas/plecos/predators), `forageStrength` (short downward pitch + pause for corys/otos), `surfaceVisit` (occasional rise for labyrinth fish), and `bodyWiggle` (extra lateral sway for kuhlis/loaches) as additive modulations on top of the base path.
   - Keep the existing `reduced` (reduced-motion) short-circuit and the existing `bounds` clamp intact.

3. **No changes** to the fish geometry, materials, `fishVisuals.ts`, selection ring, drag behaviour, scoring engine, or data model. This is purely an animation upgrade inside `FishMesh.tsx` plus the new file.

## Notes

- All new logic lives client-side inside `useFrame`; no server functions, no schema, no new deps.
- The archetypes in your file assume fields already on `Species` (`active`, `is_schooling`, `long_finned`, `predatory`, `fin_nipper`, `temperament`, `swim_zone`) — those all exist in `src/lib/types.ts`, so no type changes needed.
- After wiring, I'll typecheck and spot-check the preview to confirm no runtime errors and that a mixed tank (e.g. neons + kuhlis + a betta) visibly moves differently per species.
