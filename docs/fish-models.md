# Fish model pipeline

FishTankr renders every fish through `FishRenderer`, which dispatches to
either the procedural body (`ProceduralFish`) or a rigged GLB
(`GltfFish`). The procedural path is always the fallback — a species
without a registry entry, an entry without a resolvable model URL, a
Suspense load failure, a decoder error, or a mid-flight WebGL context loss
all end up rendering the procedural fish.

This document is a checklist for adding a new photorealistic species. Do
not commit an asset that does not tick every box below.

## 1. Registry entry

Add a `FishAssetDefinition` to `src/lib/fish3d/registry.ts` keyed by the
species' Supabase `id`. Empty `models` is a valid staging state.

## 2. Asset requirements

- **Format**: `.glb` (binary glTF 2.0). No `.gltf` + external buffers.
- **Orientation**: `+X` forward, `+Y` up, origin at centre of mass.
- **Scale**: 1 model unit = 1 cm. Record the nose-to-caudal-tip length in
  `modelReferenceLengthCm`.
- **Rig**: single armature named `Armature`. Skinned mesh named `Body`.
  Bones: `spine.001`–`spine.NNN`, `tail`, `pec.L`, `pec.R`, `dorsal`,
  `anal` (as applicable to the species).
- **Clips** (subset per species — mapping falls back down the chain):
  - `Idle` (looping)
  - `Cruise` (looping)
  - `FastSwim` (looping)
  - `Dart` (one-shot)
  - `TurnL`, `TurnR` (one-shot)
  - `Forage`, `Surface`, `Hover`, `Display` (optional)
- **Materials**: PBR only. `KHR_materials_pbrSpecularGlossiness` is
  disallowed. Split materials: `body`, `fins` (alpha blend), `eye`
  (clearcoat). No embedded scripts.
- **Textures**: 512² base colour + 512² normal, converted to KTX2/Basis
  after optimisation. Fins use an alpha mask.
- **Licence**: CC0, CC-BY (with attribution recorded here), or original
  commissioned work. No scraped assets.
- **Validation**: passes `gltf-validator`. Medium-LOD target < 250 KB.

## 3. Naming

- Folder: `public/models/fish/<species-id>/`
- Files: `<species-id>.<lod>.glb` where `<lod> ∈ high | medium | low`
- External textures (if any): `<species-id>_<map>.ktx2`
- Clip names: PascalCase (`Idle`, `Cruise`, `FastSwim`, `Dart`, `TurnL`,
  `TurnR`, `Forage`, `Surface`, `Hover`, `Display`).
- Mesh nodes: `Body`, `Fin_Dorsal`, `Fin_Anal`, `Fin_Pec_L`, `Fin_Pec_R`,
  `Fin_Caudal`.
- Bones: `spine.NNN`, `tail`, `pec.L/R`, etc.

## 4. Optimisation pipeline

Run per asset, locally, before committing:

```text
Blender (author, decimate, bake) → export GLB
  → gltf-transform prune --keep-attributes false
  → gltf-transform dedup
  → gltf-transform weld
  → gltf-transform meshopt --level medium
  → gltf-transform resize --width 512 --height 512
  → gltf-transform ktx2 --mode etc1s
  → gltf-transform inspect
  → gltf-validator
```

Meshopt is preferred for skinned fish; Draco is fine for static hardscape.

## 5. Hosting

- Files ≤ 200 KB → commit under `public/models/fish/<species-id>/`.
- Files > 200 KB → upload via `lovable-assets` and reference the `.asset.json`
  URL from the registry entry.

## 6. Licence log

| Species | Source | Author | Licence | Notes |
| --- | --- | --- | --- | --- |
| _none yet_ | | | | |

## 7. Anti-checklist

- Never remove the procedural renderer.
- Never mix total-length and standard-length measurements in one entry.
- Never bake root translation into a clip (breaks movement math).
- Never hard-code species assets outside `src/lib/fish3d/registry.ts`.
- Never publish an entry with `renderMode: 'gltf'` and a live model URL
  before the file has passed `gltf-validator` and the licence log is updated.
