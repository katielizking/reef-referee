import type { FishAssetDefinition } from "./types";

// Only species that need a photorealistic GLB path appear here. Everything
// else falls through to the procedural renderer with zero configuration.
//
// A registry entry with an empty `models` map is intentional: it declares
// intent to eventually ship a GLB, while keeping the runtime fallback active
// until an approved, licensed asset is added.

const REGISTRY: Record<string, FishAssetDefinition> = {
  "neon-tetra": {
    speciesId: "neon-tetra",
    commonName: "Neon Tetra",
    renderMode: "gltf",
    bodyFamily: "slender-schooler",
    models: {}, // filled in once an approved GLB is licensed and uploaded
    adultLengthCm: 4,
    modelReferenceLengthCm: 4,
    lengthMeasurement: "total",
    orientation: { forwardAxis: "+x", verticalOffset: 0 },
    animations: {
      idle: "Idle",
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
