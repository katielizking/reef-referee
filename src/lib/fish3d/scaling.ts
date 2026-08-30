import type { FishAssetDefinition } from "./types";

/** Scene units per cm. Matches the procedural renderer's convention. */
export const CM_PER_UNIT = 10;

/**
 * Compute the uniform scale factor to apply to a cloned GLB scene so that
 * the resulting fish is biologically correct in the aquarium.
 *
 *   renderScale = (adultLengthCm / modelReferenceLengthCm) / cmPerUnit
 *
 * `adultLengthCm` and `modelReferenceLengthCm` must be measured with the
 * same convention (total length by default). The registry entry records
 * which convention it uses; do not mix.
 */
export function computeRenderScale(params: {
  adultLengthCm: number;
  modelReferenceLengthCm: number;
  cmPerUnit?: number;
}): number {
  const cmPerUnit = params.cmPerUnit ?? CM_PER_UNIT;
  if (!Number.isFinite(params.modelReferenceLengthCm) || params.modelReferenceLengthCm <= 0) {
    return 1 / cmPerUnit;
  }
  return params.adultLengthCm / params.modelReferenceLengthCm / cmPerUnit;
}

/**
 * Rotation (Y) that reorients the model's declared forward axis onto the
 * scene's +X forward axis used by every FishMesh / FishGroup consumer.
 */
export function forwardAxisRotationY(
  forwardAxis: FishAssetDefinition["orientation"] extends infer O
    ? O extends { forwardAxis: infer F }
      ? F
      : "+x"
    : "+x",
): number {
  switch (forwardAxis) {
    case "+x":
      return 0;
    case "-x":
      return Math.PI;
    case "+z":
      return -Math.PI / 2;
    case "-z":
      return Math.PI / 2;
    default:
      return 0;
  }
}
