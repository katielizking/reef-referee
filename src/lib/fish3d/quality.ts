import type { FishLod } from "./types";

export type FishQualityTier = "high" | "medium" | "low" | "procedural";

export interface QualityInputs {
  deviceTier: "high" | "medium" | "low";
  quantity: number;
  prefersReducedMotion: boolean;
  showFineDetail: boolean;
  /** True when this species is currently selected — bumps quality for close inspection. */
  selected?: boolean;
}

/** Cached device tier evaluation. Cheap, but only run once per session. */
let cachedDeviceTier: "high" | "medium" | "low" | null = null;

export function detectDeviceTier(): "high" | "medium" | "low" {
  if (cachedDeviceTier) return cachedDeviceTier;
  if (typeof navigator === "undefined") return "medium";

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent ?? "");

  let tier: "high" | "medium" | "low";
  if (mobile && (cores <= 4 || memory <= 2)) tier = "low";
  else if (mobile || cores <= 4 || memory <= 4) tier = "medium";
  else tier = "high";

  cachedDeviceTier = tier;
  return tier;
}

/**
 * Decide what to render for a species given tank population and device.
 * The dispatcher (`FishRenderer`) uses "procedural" as a hard downgrade;
 * anything else routes to the GLB path if the asset registry has a URL.
 */
export function resolveQuality(inputs: QualityInputs): FishQualityTier {
  const { deviceTier, quantity, prefersReducedMotion, showFineDetail, selected } = inputs;

  if (prefersReducedMotion) return "procedural";
  if (!showFineDetail) return "procedural";

  if (deviceTier === "low") {
    if (quantity > 8) return "procedural";
    return "low";
  }

  if (deviceTier === "medium") {
    if (quantity > 12) return "procedural";
    if (quantity > 6) return "low";
    return selected ? "high" : "medium";
  }

  // High-tier desktop.
  if (quantity > 24) return "procedural";
  if (quantity > 12) return "medium";
  return selected ? "high" : "medium";
}

export function tierToLod(tier: Exclude<FishQualityTier, "procedural">): FishLod {
  return tier;
}
