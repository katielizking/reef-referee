
# Photorealistic Fish Pipeline — Architecture Plan

## 1. Current fish-rendering architecture (audit)

**Stack (already installed):**
- React `^19.2.0`
- `@react-three/fiber` `^9`
- `@react-three/drei` `^10.7.7` (includes `useGLTF`, `useAnimations`, `useKTX2`, Draco/Meshopt helpers)
- `three` `^0.185.1`

No GLB loading is currently used anywhere. No `useGLTF`, `GLTFLoader`, `AnimationMixer`, `useAnimations`, `KTX2Loader`, `DRACOLoader`, or `MeshoptDecoder` references exist in `src/`.

**Fish rendering path (today):**

```text
TankScene.tsx
  └─ DragGroup (per species entry)
       └─ FishGroup  (species, quantity, interior, centerY)
            └─ FishMesh × quantity   ← procedural sphere/plane/extrude meshes
```

- `src/components/tank3d/FishMesh.tsx` — 732-line monolith. `FishGroup` computes per-instance offsets/phases, then renders N `FishMesh` children. Each `FishMesh` builds a procedural body (sphere), tail (extruded shape), fins, markings, and drives them with `useFrame`.
- `src/components/tank3d/fishBehaviours.ts` — `fishBehaviourProfile(species) → FishBehaviourProfile` (movement style, cruise speed, ranges, turn rate, tail freq/amp, burst, forage, schooling cohesion, surface visit, body wiggle). This is the behaviour brain.
- `src/components/tank3d/fishVisuals.ts` — `fishVisualProfile(species) → FishVisualProfile` (body proportions, tail style, dorsal/ventral fin sizes, pattern). Only used by the procedural renderer.
- `src/components/tank3d/palette.ts` — deterministic per-species colour + hash helpers.
- `src/components/tank3d/useReducedMotion.ts` — pauses animation for `prefers-reduced-motion`.
- Species data: `species.id: string`, `species.adult_size_cm: number`, `species.swim_zone: 'top'|'mid'|'bottom'`, `species.is_schooling: boolean`, `species.active: boolean` (from `src/lib/types.ts` and Supabase `species` table). Stocking / bioload / compatibility all key off these fields — they must not change.
- Scaling today: `rawLen = adult_size_cm / 10` scene units, clamped to `min(interior)*0.42`. Semantics of `adult_size_cm` are not documented as TL vs SL — the plan treats it as **total length (TL)** and records that decision.
- Position/heading/animation state lives entirely inside `FishMesh`'s `useFrame` closure (Vector3 refs, no store). No global fish state.
- Aquarium assets: everything is code-generated. No `public/models/` directory, no `src/assets/` binary files for 3D. Lovable Assets externalises binaries; small models can live under `public/` for zero-latency import but the CDN pipeline (`.asset.json`) is preferred for anything > ~200 KB and for cache stability.
- Mobile / perf safeguards in `TankScene.tsx`: `dpr={[1, 2]}`, `frameloop="always"`, `powerPreference: 'high-performance'`; `showFineDetail = quantity <= 20` hides some decorative meshes for large schools; reduced-motion short-circuit.

**Conflicts / gotchas that will affect a GLB renderer:**
- `FishGroup` scales the whole child group by `length` (`scale={length}`). A GLB scene has its own scale/orientation baked in — we must not double-scale, and must normalise orientation before applying real-world size.
- The behaviour code writes directly to `group.rotation.y/x/z` and to hand-authored `tailRef`/`pectoralRef` meshes. A GLB fish won't have those refs — the animation controller must translate the *same behaviour outputs* into clip weights / mixer time, not spawn a parallel movement loop.
- `DragGroup` is the transform parent (position override, selection). GLB fish must slot in as its child exactly like `FishGroup` does, so drag/selection keeps working with zero changes to `DragGroup`.
- `showFineDetail` currently drives procedural decoration only. It will become one of the inputs to the quality manager (fine detail off → force low LOD / drop to procedural for huge schools).

## 2. Recommended hybrid renderer architecture

```text
TankScene
  └─ DragGroup (per species)
       └─ FishGroup                     ← unchanged responsibilities (schooling layout, quantity, centerY)
            └─ FishRenderer × quantity  ← new: chooses procedural vs GLB
                 ├─ ProceduralFish      ← existing FishMesh body, extracted 1:1
                 └─ GltfFish            ← new: rigged model + animation mixer
                      └─ FishAnimationController (internal hook)
```

**Component split**

- `FishRenderer` — thin dispatcher. Reads `FishAssetRegistry.get(speciesId)`. If `renderMode === 'gltf'` and a URL resolves, mounts `<Suspense fallback={<ProceduralFish/>}><GltfFish/></Suspense>` inside a `FishAssetFallback` error boundary. Otherwise mounts `ProceduralFish`. Movement inputs (basePosition, phase, behaviour, bounds, length, reduced, selected, onSelect) are passed through **identically** to both variants.
- `ProceduralFish` — the current `FishMesh` body, moved out of `FishMesh.tsx` unchanged. Same props, same behaviour. This guarantees the fallback path is byte-identical to today.
- `GltfFish` — loads the model via `useGLTF` (which `<Suspense>` handles), clones it with `SkeletonUtils.clone` (safe for skinned meshes and independent animation per instance), applies orientation + real-world scale, and delegates per-frame work to `FishAnimationController`. The behaviour → transform math is the shared `moveFish(...)` helper (see section 4), so we do not duplicate movement logic.
- `FishAnimationController` — internal hook, not exported as a route. Owns the `AnimationMixer` for a single instance (via `useAnimations`), maps the current behavioural state to a clip name (section 5), cross-fades on state change, and scales `mixer.timeScale` with instantaneous speed so tail beat tracks cruise vs dart.
- `FishAssetRegistry` — a plain module (`src/lib/fish3d/registry.ts`) exporting `getFishAsset(speciesId): FishAssetDefinition | null` and `hasGltfAsset(speciesId): boolean`. Definitions live in a typed record keyed by `species.id`. No DB changes.
- `FishAssetFallback` — small error boundary (`componentDidCatch`) that re-renders `ProceduralFish` if the GLB path throws (bad glTF, decoder failure, WebGL context lost mid-load, timeout).
- `FishQualityManager` — module (`src/lib/fish3d/quality.ts`) exposing `resolveQuality({ deviceTier, quantity, distance, prefersReducedMotion, showFineDetail })` returning `'high' | 'medium' | 'low' | 'procedural'`. Consumers: `FishRenderer` (procedural downgrade for big schools on mobile) and `GltfFish` (chooses which of `models.high/medium/low` to load).
- `FishModelLoader` — wrapper around `useGLTF` that (a) registers Draco/Meshopt/KTX2 decoders once, (b) exposes `preloadFishModel(url)` so we can prefetch when a species is added to the tank, (c) tracks a per-URL in-flight promise so multiple fish don't kick off duplicate downloads.

**Where movement stays authoritative**

The existing `fishBehaviourProfile` is unchanged and continues to produce `FishBehaviourProfile`. `FishRenderer` runs the shared movement integrator (extracted from `FishMesh`'s `useFrame`) and hands the result — position, rotation, instantaneous speed, current behaviour state (idle/cruise/burst/forage/surface) — to whichever renderer is mounted. GLB fish never re-derive movement; they only react to it.

## 3. Species asset registry

New file: `src/lib/fish3d/types.ts`

```ts
export type FishRenderMode = 'procedural' | 'gltf';

export type FishBodyFamily =
  | 'slender-schooler' | 'deep-bodied' | 'livebearer' | 'labyrinth'
  | 'cichlid' | 'catfish' | 'loach' | 'sucker' | 'goldfish'
  | 'predator' | 'other';

export type FishAnimationState =
  | 'idle' | 'hover' | 'cruise' | 'fast' | 'dart'
  | 'turnLeft' | 'turnRight' | 'forage' | 'surface' | 'patrol' | 'display';

export interface FishAssetDefinition {
  speciesId: string;                 // matches species.id in Supabase
  commonName: string;
  renderMode: FishRenderMode;
  bodyFamily: FishBodyFamily;

  models?: Partial<Record<'high' | 'medium' | 'low', string>>;

  // Length semantics MUST be recorded — species.adult_size_cm is TL.
  adultLengthCm: number;             // canonical adult total length
  modelReferenceLengthCm: number;    // measured nose-to-caudal-tip in the GLB
  lengthMeasurement: 'total' | 'standard';   // default 'total'

  orientation?: {
    forwardAxis: '+x' | '-x' | '+z' | '-z';  // default '+x' to match procedural
    verticalOffset: number;                  // in model units
    rotationOffset?: [number, number, number];
  };

  animations?: Partial<Record<FishAnimationState, string>>; // clip names in GLB

  materialProfile?: {
    bodyRoughness?: number;
    iridescence?: number;
    finOpacity?: number;
    finTransmission?: number;
    eyeClearcoat?: number;
  };
}
```

New file: `src/lib/fish3d/registry.ts` — exports the registry map plus lookup helpers. Every species in the DB has an implicit `{ renderMode: 'procedural' }` default; only overrides are stored.

Pilot entry (placeholder — no URL until an approved model is added):

```ts
{
  speciesId: 'neon-tetra',
  commonName: 'Neon Tetra',
  renderMode: 'gltf',
  bodyFamily: 'slender-schooler',
  models: {},                              // filled in when the .glb is licensed & uploaded
  adultLengthCm: 4,
  modelReferenceLengthCm: 4,
  lengthMeasurement: 'total',
  orientation: { forwardAxis: '+x', verticalOffset: 0 },
  animations: { idle: 'Idle', cruise: 'Cruise', fast: 'FastSwim', turnLeft: 'TurnL', turnRight: 'TurnR' },
}
```

Until `models.high|medium|low` are populated, `FishRenderer` sees "no resolvable URL" and transparently falls back to procedural — this is the guardrail against publishing a broken pilot.

## 4. Files created / modified

**Created**
- `src/lib/fish3d/types.ts` — `FishAssetDefinition`, states, families.
- `src/lib/fish3d/registry.ts` — registry map + `getFishAsset`, `hasGltfAsset`.
- `src/lib/fish3d/quality.ts` — `FishQualityManager` (`resolveQuality`).
- `src/lib/fish3d/scaling.ts` — `computeRenderScale({ adultLengthCm, modelReferenceLengthCm, cmPerUnit })` and orientation helpers.
- `src/components/tank3d/fish/FishRenderer.tsx` — dispatcher + shared movement integrator (extracted from `FishMesh` `useFrame`).
- `src/components/tank3d/fish/ProceduralFish.tsx` — the current `FishMesh` body, extracted verbatim.
- `src/components/tank3d/fish/GltfFish.tsx` — GLB variant.
- `src/components/tank3d/fish/FishAnimationController.ts` — hook mapping state → mixer.
- `src/components/tank3d/fish/FishModelLoader.ts` — decoder setup + `preloadFishModel`.
- `src/components/tank3d/fish/FishAssetFallback.tsx` — error boundary.
- `docs/fish-models.md` — asset requirements, naming, optimisation pipeline, licence log template.
- `public/models/fish/.gitkeep` — empty asset root (files themselves via Lovable Assets `.asset.json` when > ~200 KB).

**Modified (surgical only)**
- `src/components/tank3d/FishMesh.tsx` — `FishGroup` renders `<FishRenderer />` instead of the inline `FishMesh`. The procedural body is moved to `ProceduralFish.tsx`; the `FishMesh` file becomes ~50 lines re-exporting `FishGroup` for backward compatibility.
- `src/components/tank3d/TankScene.tsx` — no change to markup, but wraps the fish subtree in a single top-level `<Suspense>` so multiple GLB loads coalesce cleanly without blanking the whole aquarium (a local `<Suspense>` inside `FishRenderer` provides the per-instance procedural fallback).

**Not modified**
- `fishBehaviours.ts`, `fishVisuals.ts`, `palette.ts`, `useReducedMotion.ts`.
- `DragGroup.tsx`, selection/history stores.
- `src/lib/types.ts`, Supabase schema, scoring / bioload / compatibility.

## 5. Behaviour → animation clip mapping

Behaviour flags already produced by `fishBehaviourProfile` (and the movement integrator) map to states as follows. `FishAnimationController` picks the highest-priority active state and cross-fades to the mapped clip over ~250 ms; if the mapped clip is absent it falls back down the priority chain (dart→fast→cruise→idle).

| Behaviour signal | State | Clip preference | Speed → `mixer.timeScale` |
|---|---|---|---|
| `speedMul > 1 + burst*1.2` | `dart` | `dart` → `fast` → `cruise` | 1.6× |
| `speedMul > 1.05` (burst active) | `fast` | `fast` → `cruise` | 1.25× |
| `forageStrength > 0` && forage envelope high | `forage` | `forage` → `idle` | 0.7× |
| `surfaceVisit > 0` && rising | `surface` | `surface` → `cruise` | 1.0× |
| `pauseMul < 0.35` | `hover` | `hover` → `idle` | 0.5× |
| `|headingDelta| > 0.6` | `turnLeft` / `turnRight` | one-shot, additive if present | 1.0× |
| default | `cruise` | `cruise` → `idle` | 1.0× |
| reduced motion | `idle` | `idle` | paused |

Tail-beat frequency (`behaviour.tailFrequency * f(speed)`) is reused to modulate `mixer.timeScale`, so a rigged tetra beats faster during a dart without needing separate clips.

## 6. Real-world adult scaling

Single scaling function in `src/lib/fish3d/scaling.ts`:

```text
renderScale = (adultLengthCm / modelReferenceLengthCm) × (1 / cmPerUnit)   // cmPerUnit = 10 today
```

Applied to the cloned GLB scene root **before** `FishGroup`'s outer `scale={length}` — actually the outer scale wrapping is removed for GLB fish; instead `FishRenderer` passes `length` to `ProceduralFish` (which keeps today's behaviour) and passes `adultLengthCm` to `GltfFish` (which uses the scaling function). This avoids the double-scale trap.

`lengthMeasurement` is recorded per asset. `species.adult_size_cm` is treated as total length (TL); if a future asset is measured by standard length (SL), the registry entry declares it and the scaling function converts using the entry's own `modelReferenceLengthCm` (which must be measured with the same convention).

Silhouette-dominant species (tall angelfish, veiltail bettas, whiskered catfish) get an optional `siluetteAspect` field later — deferred; the pilot's slender tetra doesn't need it.

## 7. Cloning multiple animated fish

`SkeletonUtils.clone` from `three/examples/jsm/utils/SkeletonUtils.js` is the correct primitive: it deep-clones a skinned scene, rebinds the skeleton to the cloned bone hierarchy, and shares GPU geometry/textures across instances. Each clone gets its own `AnimationMixer`, so 12 tetras can play different clip phases from one downloaded GLB.

- **Not** `object.clone()` — reuses bone references, so all instances animate in lockstep and pose corruption follows.
- **Not** `InstancedMesh` — cannot skin per-instance.
- **Not** `BatchedMesh` — same limitation for skinned rigs.

`FishModelLoader` caches the raw GLTF (drei's `useGLTF` already does this by URL). `GltfFish` calls `SkeletonUtils.clone(gltf.scene)` in `useMemo(..., [gltf, instanceIndex])`, then feeds `gltf.animations` (shared, immutable clips) into a per-instance `AnimationMixer`. Cleanup: `mixer.stopAllAction()` on unmount; per-instance clones are eligible for GC. Shared geometry/textures are disposed by `useGLTF.clear(url)` when the species is removed from the tank (called from a `useEffect` cleanup in `FishGroup`).

## 8. Performance & mobile

- **Lazy loading**: `preloadFishModel(registry.models.medium)` fires when a species is added to the tank (subscribe in `FishGroup`), not at app boot. Nothing downloads for species that aren't in the current tank.
- **Decoders registered once** in `FishModelLoader`: `DRACOLoader` + `MeshoptDecoder` + `KTX2Loader` via drei's `useGLTF.setDecoderPath` and `<KTX2Loader>` helper.
- **Deduplication**: drei caches by URL; `SkeletonUtils.clone` reuses buffers. Textures are shared across clones.
- **Quality tiers** via `FishQualityManager`:
  - Device tier from `navigator.hardwareConcurrency`, `deviceMemory`, and `gl.getParameter(gl.MAX_TEXTURE_SIZE)`.
  - Rules: mobile + quantity > 12 → force procedural; mobile + quantity > 6 → `low` LOD; desktop default → `medium`; camera zoom close and selected species → `high`.
- **DPR clamp**: keep current `dpr={[1, 2]}`; on `deviceTier === 'low'` clamp to `[1, 1.25]` (patch in `TankScene`, gated on tier).
- **Re-render discipline**: `FishRenderer` memoises props; movement lives in `useFrame`, not React state. Registry lookups are memoised by `speciesId`.
- **Large schools**: quality manager can flip a whole species to procedural on the fly; the switch is a component swap, not a scene rebuild.
- **Loading UX**: `<Suspense>` fallback is `ProceduralFish` — the aquarium is never blank. No global spinner.
- **WebGL context loss**: existing `three` renderer will emit `webglcontextlost`; `FishAssetFallback` catches downstream errors and falls back to procedural. On `webglcontextrestored`, drei's `useGLTF` re-uploads; no manual action needed.
- **Disposal**: `useEffect` in `FishGroup` calls `useGLTF.clear(url)` when a species is removed from `state.species`.

## 9. Asset requirements for the neon-tetra pilot

The neon tetra is not sourced in this phase. When it is added, the asset must satisfy:

- **File**: `public/models/fish/neon-tetra/neon-tetra.medium.glb` (plus optional `.high.glb`, `.low.glb`). Files > 200 KB use Lovable Assets (`.asset.json` pointer).
- **Orientation**: `+X` forward, `+Y` up, centred on the origin. Any deviation is declared in `registry.orientation`.
- **Scale**: model measured 4 cm nose-to-caudal-tip in model units == cm (so 1 unit = 1 cm inside the file; `modelReferenceLengthCm: 4`).
- **Rig**: single armature named `Armature`; bones `spine.001`–`spine.005`, `tail`, `pec.L`, `pec.R`, `dorsal`, `anal`. Skinned mesh named `Body`.
- **Clips**: named exactly `Idle`, `Cruise`, `FastSwim`, `Dart`, `TurnL`, `TurnR`, all looping except `Dart`/`TurnL`/`TurnR` (one-shot). Duration ~1–2 s, root-locked (no translation baked in).
- **Materials**: PBR (`KHR_materials_pbrSpecularGlossiness` disallowed). Separate `body`, `fins` (alpha-blend), `eye` (clearcoat). No embedded scripts, no unresolved external refs.
- **Textures**: 512² base colour + 512² normal (KTX2/Basis after optimisation). Fins use alpha mask.
- **Licence**: CC0, CC-BY (with attribution captured in `docs/fish-models.md`), or original commissioned work. No scraped / unlicensed assets.
- **Validation**: passes `gltf-validator`, `< 250 KB` medium LOD target.

## 10. Optimisation pipeline (documented, not installed yet)

Recorded in `docs/fish-models.md` for use per-asset:

```text
Blender (author, decimate, bake) → export GLB
  → gltf-transform prune --keep-attributes false
  → gltf-transform dedup
  → gltf-transform weld
  → gltf-transform meshopt --level medium         (geometry compression)
  → gltf-transform resize --width 512 --height 512
  → gltf-transform ktx2 --mode etc1s              (texture compression)
  → gltf-transform inspect                         (size report)
  → gltf-validator                                 (spec compliance)
```

Draco is available as an alternative to Meshopt when the asset is static-mesh heavy; skinned fish do better with Meshopt.

No CLI tools are added to the repo in this phase — the pipeline is a per-asset chore run locally when a model is prepared.

## 11. Naming conventions

- Registry key = `species.id` (existing DB PK, hyphenated slug).
- Folder: `public/models/fish/<species-id>/`
- Files: `<species-id>.<lod>.glb` where `<lod> ∈ high | medium | low`
- Textures (external, only if not embedded): `<species-id>_<map>.ktx2` (`map ∈ basecolor | normal | roughness`).
- Clip names: PascalCase from the state enum (`Idle`, `Cruise`, `FastSwim`, `Dart`, `TurnL`, `TurnR`, `Forage`, `Surface`, `Hover`, `Display`).
- Mesh nodes: `Body`, `Fin_Dorsal`, `Fin_Anal`, `Fin_Pec_L`, `Fin_Pec_R`, `Fin_Caudal`.
- Bones: `spine.NNN`, `tail`, `pec.L/R`, etc.

## 12. Risks & likely problems

- **Double scaling**: `FishGroup` currently applies `scale={length}` to the child. `FishRenderer` must switch this off for GLB fish and use the scaling function instead. Test both variants side-by-side.
- **Behaviour drift**: extracting the `useFrame` movement integrator into a shared helper must be verbatim; a subtle math change would silently regress the whole aquarium. Mitigation — extract as a pure function of `(t, delta, behaviour, bounds, basePosition, phase, instanceIndex, length)` and cover with a Vitest snapshot on a fixed clock.
- **Skinned-clone pitfalls**: forgetting `SkeletonUtils.clone` causes all instances to pose in lockstep; caught by the pilot's 6-fish neon school.
- **Suspense blanking**: nesting `<Suspense>` inside `FishRenderer` with the procedural component as fallback prevents a whole-canvas flash while the GLB streams in.
- **Mobile GPU limits**: KTX2 fallback path on some Android devices requires ASTC → ETC1S selection at load time; drei handles this but must be verified.
- **Licence contamination**: never commit an asset without an entry in `docs/fish-models.md` naming source + licence.
- **Registry vs DB drift**: the registry is compile-time typed and keyed by `species.id`; a rename in the DB would silently orphan an entry. Mitigation — a boot-time `console.warn` in dev for registry entries whose ID isn't present in the loaded species list.
- **Reduced-motion**: `AnimationMixer.timeScale = 0` + freeze position — must be wired at the same point the procedural path short-circuits.

## 13. Phased implementation sequence (proof-of-concept)

Each phase is independently mergeable and preserves the existing procedural aquarium exactly.

1. **Extract without behaviour change.** Move `FishMesh`'s procedural body into `ProceduralFish.tsx`, introduce `FishRenderer` that always returns `ProceduralFish`, wire it from `FishGroup`. Ship. Visually identical to today.
2. **Registry + types.** Add `src/lib/fish3d/{types,registry,scaling,quality}.ts`. `FishRenderer` reads the registry but every species still resolves to procedural (empty `models`). Ship.
3. **GLB path (dark).** Add `GltfFish`, `FishAnimationController`, `FishModelLoader`, `FishAssetFallback`. Feature-flag by `renderMode === 'gltf' && models.medium`. Registry stays empty; nothing changes at runtime. Ship.
4. **Neon-tetra placeholder.** Add the neon-tetra registry entry with `renderMode: 'gltf'` but empty `models`. Confirm fallback logic in the wild — tetras still render procedurally, no errors in console. Ship.
5. **Pilot model.** Once an approved neon-tetra GLB is available, drop it under `public/models/fish/neon-tetra/` (or via Lovable Assets), fill `models.medium`, verify scaling, animation blend, and school of 6 in a real tank. This is the first turn where a licensed binary enters the repo.
6. **Quality manager tuning + preload.** Wire `preloadFishModel` on species-add, verify mobile behaviour, tune thresholds.

No further species are onboarded in this proof of concept.

## What is explicitly not in this plan

No model sourcing or downloading. No package installs (drei, three, react-three-fiber are already present; Draco/Meshopt/KTX2 loaders ship inside drei/three). No database migrations. No lighting, water, plants, or décor changes. No changes to scoring, bioload, compatibility, or welfare calculations. No removal of the procedural fish.
