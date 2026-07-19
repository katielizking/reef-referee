import type { FishAssetDefinition } from "./types";
import neonTetraGlb from "./assets/neon-tetra.premium.glb.asset.json";

// Only species that need a photorealistic GLB path appear here. Everything
// else falls through to the procedural renderer with zero configuration.
//
// Registry is keyed by the Supabase species UUID (see the `species` table).
// Do not key by slug or common name — those are not guaranteed to be stable.

// Neon tetra — resolved from scientific_name = "Paracheirodon innesi"
// against the live species catalogue.
const NEON_TETRA_ID = "19a5e713-7fa1-4abb-b6fc-ac564b6be103";

const REGISTRY: Record<string, FishAssetDefinition> = {
  [NEON_TETRA_ID]: {
    speciesId: NEON_TETRA_ID,
    commonName: "Neon Tetra",
    renderMode: "gltf",
    bodyFamily: "slender-schooler",
    models: {
      // Premium code-generated GLB — 1.5MB, hosted on CDN.
      medium: neonTetraGlb.url,
    },
    adultLengthCm: 4,
    // Measured nose-to-caudal length of the GLB in its authored units.
    // The runtime measures the actual bounding box on load and rescales
    // from there, so this value is only used as a sanity fallback.
    modelReferenceLengthCm: 4,
    lengthMeasurement: "total",
    orientation: { forwardAxis: "+x", verticalOffset: 0 },
    animations: {
      idle: "Idle",
      hover: "Idle",
      cruise: "Cruise",
      fast: "FastSwim",
      dart: "Dart",
      turnLeft: "TurnL",
      turnRight: "TurnR",
    },
    materialProfile: {
      bodyRoughness: 0.32,
      iridescence: 0.6,
      finOpacity: 0.85,
      eyeClearcoat: 0.6,
    },
  },
};

export function getFishAsset(speciesId: string): FishAssetDefinition | null {
  return REGISTRY[speciesId] ?? null;
}

/** Returns true only when a GLB URL is actually resolvable — otherwise fall back to procedural. */
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
