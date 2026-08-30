import type { Species } from "@/lib/types";

export type FishMovementStyle =
  | "tight-school"
  | "loose-shoal"
  | "surface-darter"
  | "labyrinth-hoverer"
  | "bottom-forager"
  | "bottom-slinker"
  | "grazer"
  | "hoverer"
  | "territorial"
  | "ambush"
  | "cruiser";

export interface FishBehaviourProfile {
  style: FishMovementStyle;
  /** Multiplies the deterministic path speed. */
  cruiseSpeed: number;
  /** Portion of the available tank length/depth used by the path. */
  rangeX: number;
  rangeZ: number;
  verticalRange: number;
  /** How quickly the model follows a new heading. */
  turnRate: number;
  /** Tail and pectoral fin movement at normal cruising speed. */
  tailFrequency: number;
  tailAmplitude: number;
  pectoralFrequency: number;
  bodyRoll: number;
  maxPitch: number;
  /** Gives active or predatory species short darts. */
  burstStrength: number;
  /** Used by bottom dwellers to periodically angle down. */
  forageStrength: number;
  /** 0 is independent movement; 1 is a tight coordinated school. */
  schoolingCohesion: number;
  /** Amount of individual wandering layered over shared group movement. */
  individualWander: number;
  /** Amount of stop-start motion. */
  pauseStrength: number;
  /** Occasional rise toward the water surface, as a tank-height fraction. */
  surfaceVisit: number;
  /** Extra whole-body waviness for eel-like or slender species. */
  bodyWiggle: number;
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function profile(
  values: Partial<FishBehaviourProfile> & Pick<FishBehaviourProfile, "style">,
): FishBehaviourProfile {
  return {
    style: values.style,
    cruiseSpeed: values.cruiseSpeed ?? 0.7,
    rangeX: values.rangeX ?? 0.32,
    rangeZ: values.rangeZ ?? 0.24,
    verticalRange: values.verticalRange ?? 0.08,
    turnRate: values.turnRate ?? 3.6,
    tailFrequency: values.tailFrequency ?? 7,
    tailAmplitude: values.tailAmplitude ?? 0.2,
    pectoralFrequency: values.pectoralFrequency ?? 4.5,
    bodyRoll: values.bodyRoll ?? 0.025,
    maxPitch: values.maxPitch ?? 0.1,
    burstStrength: values.burstStrength ?? 0.15,
    forageStrength: values.forageStrength ?? 0,
    schoolingCohesion: values.schoolingCohesion ?? 0,
    individualWander: values.individualWander ?? 0.2,
    pauseStrength: values.pauseStrength ?? 0,
    surfaceVisit: values.surfaceVisit ?? 0,
    bodyWiggle: values.bodyWiggle ?? 0,
  };
}

/**
 * Maps catalogue metadata and recognisable genera/common names to a visual
 * movement archetype. This is intentionally deterministic and lightweight:
 * it communicates characteristic behaviour without simulating animal AI.
 */
export function fishBehaviourProfile(species: Species): FishBehaviourProfile {
  const name = `${species.common_name} ${species.scientific_name}`.toLowerCase();

  // Slender substrate fish should visibly weave rather than move like corys.
  if (includesAny(name, ["kuhli", "pangio", "loach"])) {
    return profile({
      style: "bottom-slinker",
      cruiseSpeed: species.active ? 0.72 : 0.5,
      rangeX: 0.4,
      rangeZ: 0.34,
      verticalRange: 0.025,
      turnRate: 4.8,
      tailFrequency: 9.2,
      tailAmplitude: 0.31,
      pectoralFrequency: 4,
      bodyRoll: 0.05,
      maxPitch: 0.13,
      burstStrength: 0.32,
      forageStrength: 0.38,
      schoolingCohesion: species.is_schooling ? 0.42 : 0.08,
      individualWander: 0.48,
      pauseStrength: 0.28,
      bodyWiggle: 0.12,
    });
  }

  // Corydoras and similar fish travel in loose groups, pause, then nose down.
  if (includesAny(name, ["cory", "corydoras", "goby", "gudgeon", "catfish"])) {
    return profile({
      style: "bottom-forager",
      cruiseSpeed: species.active ? 0.76 : 0.54,
      rangeX: species.active ? 0.4 : 0.3,
      rangeZ: 0.34,
      verticalRange: 0.035,
      turnRate: 4.1,
      tailFrequency: species.active ? 8.4 : 6.2,
      tailAmplitude: 0.21,
      pectoralFrequency: 5,
      bodyRoll: 0.015,
      maxPitch: 0.18,
      burstStrength: species.active ? 0.34 : 0.14,
      forageStrength: 1,
      schoolingCohesion: species.is_schooling ? 0.58 : 0.12,
      individualWander: 0.42,
      pauseStrength: 0.48,
    });
  }

  // Algae eaters visibly browse surfaces and spend longer paused than cruising.
  if (
    includesAny(name, ["otocinclus", "oto", "pleco", "bristlenose", "algae eater", "crossocheilus"])
  ) {
    return profile({
      style: "grazer",
      cruiseSpeed: species.active ? 0.66 : 0.44,
      rangeX: 0.4,
      rangeZ: 0.4,
      verticalRange: 0.09,
      turnRate: 3.4,
      tailFrequency: 6.8,
      tailAmplitude: 0.17,
      pectoralFrequency: 4.2,
      bodyRoll: 0.012,
      maxPitch: 0.2,
      burstStrength: 0.16,
      forageStrength: 0.88,
      schoolingCohesion: species.is_schooling ? 0.48 : 0.08,
      individualWander: 0.48,
      pauseStrength: 0.68,
    });
  }

  // Bettas and gouramis cruise gently, hover, and occasionally approach the surface.
  if (includesAny(name, ["betta", "gourami", "trichogaster", "trichopodus"])) {
    return profile({
      style: "labyrinth-hoverer",
      cruiseSpeed: species.active ? 0.5 : 0.36,
      rangeX: 0.23,
      rangeZ: 0.18,
      verticalRange: 0.075,
      turnRate: 2.6,
      tailFrequency: species.long_finned ? 4.2 : 5.2,
      tailAmplitude: species.long_finned ? 0.13 : 0.16,
      pectoralFrequency: 5.8,
      bodyRoll: 0.016,
      maxPitch: 0.13,
      burstStrength: species.temperament === "aggressive" ? 0.2 : 0.09,
      schoolingCohesion: 0.04,
      individualWander: 0.22,
      pauseStrength: 0.56,
      surfaceVisit: 0.22,
    });
  }

  // Tall-bodied fish glide and hold position instead of continuously circling.
  if (includesAny(name, ["angelfish", "pterophyllum", "discus", "symphysodon"])) {
    return profile({
      style: species.is_schooling ? "loose-shoal" : "hoverer",
      cruiseSpeed: 0.4,
      rangeX: 0.23,
      rangeZ: 0.19,
      verticalRange: 0.095,
      turnRate: 2.35,
      tailFrequency: 4.4,
      tailAmplitude: 0.13,
      pectoralFrequency: 5.4,
      bodyRoll: 0.012,
      maxPitch: 0.08,
      burstStrength: species.predatory ? 0.2 : 0.06,
      schoolingCohesion: species.is_schooling ? 0.58 : 0.08,
      individualWander: 0.2,
      pauseStrength: 0.5,
    });
  }

  // Surface-oriented, active species should noticeably dart along the waterline.
  if (
    includesAny(name, [
      "danio",
      "hatchetfish",
      "blue-eye",
      "pseudomugil",
      "hardyhead",
      "craterocephalus",
    ])
  ) {
    return profile({
      style: "surface-darter",
      cruiseSpeed: species.active ? 1.15 : 0.82,
      rangeX: 0.45,
      rangeZ: 0.27,
      verticalRange: 0.035,
      turnRate: 5.8,
      tailFrequency: 11.2,
      tailAmplitude: 0.27,
      pectoralFrequency: 6.2,
      bodyRoll: 0.045,
      maxPitch: 0.085,
      burstStrength: 0.72,
      schoolingCohesion: species.is_schooling ? 0.76 : 0.2,
      individualWander: 0.28,
      pauseStrength: 0.05,
    });
  }

  // Rainbowfish are fast, open-water swimmers with a broader, looser formation.
  if (includesAny(name, ["rainbowfish", "melanotaenia", "iriatherina"])) {
    return profile({
      style: "loose-shoal",
      cruiseSpeed: 1.04,
      rangeX: 0.45,
      rangeZ: 0.3,
      verticalRange: 0.08,
      turnRate: 5,
      tailFrequency: 10,
      tailAmplitude: 0.25,
      pectoralFrequency: 5.8,
      bodyRoll: 0.04,
      maxPitch: 0.09,
      burstStrength: 0.42,
      schoolingCohesion: 0.64,
      individualWander: 0.3,
      pauseStrength: 0.02,
    });
  }

  // Small tetras and rasboras look best as a coordinated, compact school.
  if (
    species.is_schooling &&
    includesAny(name, [
      "tetra",
      "rasbora",
      "hemigrammus",
      "hyphessobrycon",
      "paracheirodon",
      "boraras",
    ])
  ) {
    return profile({
      style: "tight-school",
      cruiseSpeed: species.active ? 0.98 : 0.78,
      rangeX: 0.4,
      rangeZ: 0.27,
      verticalRange: 0.065,
      turnRate: 5.5,
      tailFrequency: species.active ? 10.4 : 8.5,
      tailAmplitude: 0.24,
      pectoralFrequency: 5.8,
      bodyRoll: 0.032,
      maxPitch: 0.08,
      burstStrength: 0.26,
      schoolingCohesion: 0.92,
      individualWander: 0.09,
      pauseStrength: 0.04,
    });
  }

  // Barbs shoal, but individuals peel away and rejoin more than tetras.
  if (species.is_schooling && includesAny(name, ["barb", "puntius", "puntigrus"])) {
    return profile({
      style: "loose-shoal",
      cruiseSpeed: species.active ? 1 : 0.8,
      rangeX: 0.42,
      rangeZ: 0.31,
      verticalRange: 0.08,
      turnRate: 5,
      tailFrequency: 9.8,
      tailAmplitude: 0.25,
      pectoralFrequency: 5.4,
      bodyRoll: 0.042,
      maxPitch: 0.1,
      burstStrength: species.fin_nipper ? 0.48 : 0.3,
      schoolingCohesion: 0.62,
      individualWander: 0.34,
      pauseStrength: 0.03,
    });
  }

  // Predators wait, make a decisive burst, then settle again.
  if (species.predatory) {
    return profile({
      style: "ambush",
      cruiseSpeed: species.active ? 0.48 : 0.34,
      rangeX: 0.35,
      rangeZ: 0.28,
      verticalRange: 0.1,
      turnRate: 2.4,
      tailFrequency: 5.2,
      tailAmplitude: 0.17,
      pectoralFrequency: 3.2,
      bodyRoll: 0.018,
      maxPitch: 0.11,
      burstStrength: 1,
      schoolingCohesion: species.is_schooling ? 0.52 : 0.05,
      individualWander: 0.14,
      pauseStrength: 0.78,
    });
  }

  // Cichlids and other assertive fish repeatedly patrol a defined patch.
  if (
    species.temperament !== "peaceful" ||
    includesAny(name, ["cichlid", "aulonocara", "maylandia", "melanochromis", "labidochromis"])
  ) {
    return profile({
      style: "territorial",
      cruiseSpeed: species.active ? 0.86 : 0.62,
      rangeX: 0.29,
      rangeZ: 0.3,
      verticalRange: species.swim_zone === "bottom" ? 0.05 : 0.085,
      turnRate: 4,
      tailFrequency: species.active ? 8.8 : 6.6,
      tailAmplitude: 0.22,
      pectoralFrequency: 4.5,
      bodyRoll: 0.034,
      maxPitch: 0.11,
      burstStrength: species.fin_nipper ? 0.58 : 0.36,
      forageStrength: species.swim_zone === "bottom" ? 0.32 : 0,
      schoolingCohesion: 0.04,
      individualWander: 0.16,
      pauseStrength: 0.22,
    });
  }

  if (species.is_schooling) {
    return profile({
      style: "loose-shoal",
      cruiseSpeed: species.active ? 0.94 : 0.72,
      rangeX: 0.4,
      rangeZ: 0.28,
      verticalRange: species.swim_zone === "top" ? 0.045 : 0.075,
      turnRate: species.active ? 4.9 : 4,
      tailFrequency: species.active ? 9.6 : 7.8,
      tailAmplitude: species.active ? 0.25 : 0.21,
      pectoralFrequency: 5.4,
      bodyRoll: species.active ? 0.04 : 0.026,
      maxPitch: 0.09,
      burstStrength: species.active ? 0.36 : 0.16,
      schoolingCohesion: 0.68,
      individualWander: 0.28,
      pauseStrength: 0.06,
    });
  }

  if (species.swim_zone === "top") {
    return profile({
      style: "surface-darter",
      cruiseSpeed: species.active ? 0.96 : 0.66,
      rangeX: species.active ? 0.43 : 0.31,
      rangeZ: 0.23,
      verticalRange: 0.035,
      turnRate: 4.5,
      tailFrequency: species.active ? 9.8 : 7.2,
      tailAmplitude: 0.22,
      pectoralFrequency: 4.9,
      bodyRoll: 0.034,
      maxPitch: 0.08,
      burstStrength: species.active ? 0.5 : 0.2,
      schoolingCohesion: 0.08,
      individualWander: 0.28,
      pauseStrength: 0.06,
    });
  }

  if (species.long_finned || includesAny(name, ["ram", "puffer"])) {
    return profile({
      style: "hoverer",
      cruiseSpeed: species.active ? 0.56 : 0.4,
      rangeX: 0.22,
      rangeZ: 0.18,
      verticalRange: 0.09,
      turnRate: 2.8,
      tailFrequency: 4.8,
      tailAmplitude: 0.14,
      pectoralFrequency: 5.3,
      bodyRoll: 0.018,
      maxPitch: 0.1,
      burstStrength: species.active ? 0.2 : 0.07,
      schoolingCohesion: 0.08,
      individualWander: 0.25,
      pauseStrength: 0.48,
    });
  }

  return profile({
    style: "cruiser",
    cruiseSpeed: species.active ? 0.9 : 0.62,
    rangeX: species.active ? 0.42 : 0.3,
    rangeZ: species.active ? 0.28 : 0.22,
    verticalRange: 0.08,
    turnRate: species.active ? 4.4 : 3.4,
    tailFrequency: species.active ? 9 : 6.8,
    tailAmplitude: species.active ? 0.24 : 0.19,
    pectoralFrequency: 4.8,
    bodyRoll: species.active ? 0.038 : 0.024,
    maxPitch: 0.1,
    burstStrength: species.active ? 0.35 : 0.12,
    schoolingCohesion: 0.04,
    individualWander: 0.28,
    pauseStrength: species.active ? 0.04 : 0.18,
  });
}
