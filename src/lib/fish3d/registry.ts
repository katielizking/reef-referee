import type { FishAssetDefinition } from "./types";

// Only exact-species, reviewed 3D assets appear here. Everything else falls
// through to a clearly labelled placeholder renderer.
//
// Registry is keyed by the Supabase species UUID (see the `species` table).
// Do not key by slug or common name — those are not guaranteed to be stable.

// Neon tetra — resolved from scientific_name = "Paracheirodon innesi"
// against the live species catalogue.
// Model by aeroplankton, CC-BY: https://blendswap.com/blend/32414
const NEON_TETRA_ID = "19a5e713-7fa1-4abb-b6fc-ac564b6be103";
const NEON_TETRA_MODEL = "/models/fish/neon-tetra/neon-tetra.glb";
const BETTA_MODEL = "/models/fish/betta/betta.glb";
const BETTA_FALLBACK_KEY = "betta-splendens";

const REGISTRY: Record<string, FishAssetDefinition> = {
  [NEON_TETRA_ID]: {
    speciesId: NEON_TETRA_ID,
    commonName: "Neon Tetra",
    renderMode: "gltf",
    bodyFamily: "slender-schooler",
    models: {
      medium: NEON_TETRA_MODEL,
    },
    adultLengthCm: 4,
    modelReferenceLengthCm: 4,
    lengthMeasurement: "total",
    orientation: { forwardAxis: "+x", verticalOffset: 0 },
    animations: {
      idle: "ArmatureAction",
      hover: "ArmatureAction",
      cruise: "ArmatureAction",
      fast: "ArmatureAction",
      dart: "ArmatureAction",
      turnLeft: "ArmatureAction",
      turnRight: "ArmatureAction",
    },
    attribution: {
      creator: "aeroplankton",
      sourceUrl: "https://blendswap.com/blend/32414",
      licenseLabel: "CC BY",
      licenseUrl: "https://creativecommons.org/licenses/by/",
    },
    materialProfile: {
      bodyRoughness: 0.42,
      iridescence: 0.45,
      finOpacity: 0.8,
      eyeClearcoat: 0.45,
    },
  },
};

export function getFishAsset(speciesId: string): FishAssetDefinition | null {
  return REGISTRY[speciesId] ?? null;
}

/** Returns true only when a GLB URL is actually resolvable — otherwise use the placeholder. */
export function hasGltfAsset(speciesId: string): boolean {
  const asset = REGISTRY[speciesId];
  if (!asset || asset.renderMode !== "gltf") return false;
  const models = asset.models ?? {};
  return Boolean(models.medium ?? models.high ?? models.low);
}

/** Choose the best available model URL for a target LOD, degrading downward. */
export function resolveModelUrl(
  asset: FishAssetDefinition,
  preferred: "high" | "medium" | "low",
): string | null {
  const m = asset.models ?? {};
  const chain =
    preferred === "high"
      ? [m.high, m.medium, m.low]
      : preferred === "medium"
        ? [m.medium, m.high, m.low]
        : [m.low, m.medium, m.high];
  return chain.find((url): url is string => typeof url === "string" && url.length > 0) ?? null;
}
