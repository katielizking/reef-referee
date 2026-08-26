# Verified 3D asset pipeline

FishTankr only presents an animal or plant as a 3D likeness when the asset is
verified for that exact taxon. Generic geometry, colour inference and
lookalike substitution are not acceptable.

## What Blender does

The repository includes `tools/blender/process_asset.py`. It:

- imports GLB, GLTF, FBX or OBJ;
- rejects missing attribution or unsupported licences;
- combines mesh parts into a web-ready body;
- centres the asset and applies transforms;
- scales fish from the recorded adult length;
- reduces excessive triangle counts;
- preserves textures, materials, skins and existing animations;
- embeds source, creator, licence and scientific-name metadata;
- exports a self-contained GLB.

Blender does not create reliable species anatomy from a name. Every input mesh
must already be an accurate likeness.

## Accepted licences

- CC0 1.0
- CC BY 4.0
- CC BY-SA 4.0
- original work owned by the project

Do not use marketplace assets merely labelled “free”. The source page must
state the licence and creator.

## Preparing a source asset

1. Put the source file under `assets/3d/source/`.
2. Copy `assets/3d/source/example.asset.json` beside it.
3. Record the accepted scientific name, source page, creator and licence.
4. For fish, record adult total length in centimetres.
5. Author fish facing `+X`, with the dorsal side up.
6. Confirm the likeness against at least two reliable reference images.

Example:

```json
{
  "asset_id": "betta-splendens",
  "common_name": "Betta",
  "scientific_name": "Betta splendens",
  "adult_length_cm": 6,
  "source_url": "https://example.com/source-model",
  "creator": "Creator name",
  "license": "CC-BY-4.0",
  "notes": "Validated against adult male veil-tail references."
}
```

## Running through GitHub

Open **Actions → Process 3D asset → Run workflow** and provide:

- the source path;
- the metadata sidecar path;
- a plain `.glb` output filename;
- fish or plant;
- a triangle target (45,000 is the default).

The job is deliberately read-only. It uploads the processed GLB as a GitHub
Actions artifact for review and retains it for 14 days. Approved assets can
then be committed under:

- `public/models/fish/<species-id>/`
- `public/models/plants/<species-id>/`

This avoids an unreviewed model or licence error automatically reaching
Lovable.

## Runtime requirements

Fish models:

- exact species, morph/sex identified where visually important;
- `+X` forward;
- measured nose-to-caudal total length;
- PBR materials;
- translucent fins where appropriate;
- preferably a single armature;
- animation clips named `Idle`, `Cruise`, `FastSwim`, `Dart`,
  `TurnL`, `TurnR`, plus optional behaviour clips.

Plant models:

- exact species or clearly identified cultivar;
- roots/rhizome represented correctly;
- leaves match real arrangement, width and growth habit;
- pivot at attachment/substrate point;
- optional subtle sway animation.

## Validation gate

Before registration, confirm:

- scientific identity;
- licence and attribution;
- silhouette and markings;
- adult scale;
- correct orientation and pivot;
- acceptable textures and alpha;
- animation has no root translation;
- mobile performance;
- GLB opens without external dependencies.

Only after those checks should the asset be added to
`src/lib/fish3d/registry.ts`.
