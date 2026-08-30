import type { Species } from "@/lib/types";
import { hash01 } from "./palette";

export type FishBodyStyle =
  | "streamlined"
  | "deep"
  | "round"
  | "bottom"
  | "disc"
  | "flowing"
  | "predator";

export type FishTailStyle = "forked" | "fan" | "rounded" | "flowing";
export type FishPattern =
  | "none"
  | "lateral-stripe"
  | "vertical-bands"
  | "spots";

export interface FishVisualProfile {
  bodyStyle: FishBodyStyle;
  tailStyle: FishTailStyle;
  pattern: FishPattern;
  bodyHalfLength: number;
  bodyHeight: number;
  bodyDepth: number;
  headLength: number;
  tailLength: number;
  tailHeight: number;
  dorsalHeight: number;
  ventralHeight: number;
  pectoralSize: number;
  eyeScale: number;
  mouthScale: number;
  finOpacity: number;
  hasBarbels: boolean;
  hasFeelers: boolean;
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function inferredPattern(species: Species, name: string): FishPattern {
  if (
    includesAny(name, [
      "neon",
      "cardinal",
      "rummy",
      "pencilfish",
      "rainbowfish",
      "rainbow fish",
      "minnow",
      "danio",
      "rasbora",
    ])
  ) {
    return "lateral-stripe";
  }

  if (
    includesAny(name, [
      "zebra",
      "tiger",
      "banded",
      "angel",
      "discus",
      "frontosa",
    ])
  ) {
    return "vertical-bands";
  }

  if (
    includesAny(name, [
      "spotted",
      "peppered",
      "leopard",
      "dalmatian",
      "galaxy",
      "jaguar",
    ])
  ) {
    return "spots";
  }

  const roll = hash01(species.id, 71);
  if (roll < 0.3) return "lateral-stripe";
  if (roll < 0.48) return "vertical-bands";
  if (roll < 0.64) return "spots";
  return "none";
}

export function fishVisualProfile(species: Species): FishVisualProfile {
  const name =
    `${species.common_name} ${species.scientific_name}`.toLowerCase();
  const pattern = inferredPattern(species, name);

  if (includesAny(name, ["angelfish", "pterophyllum"])) {
    return {
      bodyStyle: "disc",
      tailStyle: "rounded",
      pattern: "vertical-bands",
      bodyHalfLength: 0.27,
      bodyHeight: 0.36,
      bodyDepth: 0.11,
      headLength: 0.15,
      tailLength: 0.2,
      tailHeight: 0.19,
      dorsalHeight: 0.28,
      ventralHeight: 0.3,
      pectoralSize: 0.11,
      eyeScale: 0.048,
      mouthScale: 0.035,
      finOpacity: 0.72,
      hasBarbels: false,
      hasFeelers: true,
    };
  }

  if (includesAny(name, ["discus", "symphysodon"])) {
    return {
      bodyStyle: "disc",
      tailStyle: "rounded",
      pattern,
      bodyHalfLength: 0.29,
      bodyHeight: 0.33,
      bodyDepth: 0.115,
      headLength: 0.16,
      tailLength: 0.18,
      tailHeight: 0.17,
      dorsalHeight: 0.12,
      ventralHeight: 0.12,
      pectoralSize: 0.1,
      eyeScale: 0.047,
      mouthScale: 0.035,
      finOpacity: 0.76,
      hasBarbels: false,
      hasFeelers: false,
    };
  }

  if (
    includesAny(name, ["betta", "siamese fighting fish"]) ||
    species.long_finned
  ) {
    return {
      bodyStyle: "flowing",
      tailStyle: "flowing",
      pattern,
      bodyHalfLength: 0.36,
      bodyHeight: 0.18,
      bodyDepth: 0.105,
      headLength: 0.18,
      tailLength: 0.38,
      tailHeight: 0.34,
      dorsalHeight: 0.19,
      ventralHeight: 0.22,
      pectoralSize: 0.12,
      eyeScale: 0.043,
      mouthScale: 0.04,
      finOpacity: 0.7,
      hasBarbels: false,
      hasFeelers: includesAny(name, ["gourami"]),
    };
  }

  if (
    includesAny(name, ["cory", "catfish", "pleco", "bristlenose", "otocinclus"])
  ) {
    return {
      bodyStyle: "bottom",
      tailStyle: "forked",
      pattern,
      bodyHalfLength: 0.4,
      bodyHeight: 0.14,
      bodyDepth: 0.15,
      headLength: 0.22,
      tailLength: 0.24,
      tailHeight: 0.17,
      dorsalHeight: 0.13,
      ventralHeight: 0.08,
      pectoralSize: 0.16,
      eyeScale: 0.038,
      mouthScale: 0.05,
      finOpacity: 0.82,
      hasBarbels: true,
      hasFeelers: false,
    };
  }

  if (includesAny(name, ["loach", "kuhli"])) {
    return {
      bodyStyle: "bottom",
      tailStyle: "rounded",
      pattern,
      bodyHalfLength: 0.47,
      bodyHeight: 0.095,
      bodyDepth: 0.09,
      headLength: 0.2,
      tailLength: 0.19,
      tailHeight: 0.11,
      dorsalHeight: 0.075,
      ventralHeight: 0.045,
      pectoralSize: 0.08,
      eyeScale: 0.032,
      mouthScale: 0.035,
      finOpacity: 0.8,
      hasBarbels: true,
      hasFeelers: false,
    };
  }

  if (includesAny(name, ["goldfish", "fantail", "oranda"])) {
    return {
      bodyStyle: "round",
      tailStyle: includesAny(name, ["fantail", "oranda"])
        ? "flowing"
        : "forked",
      pattern,
      bodyHalfLength: 0.31,
      bodyHeight: 0.24,
      bodyDepth: 0.17,
      headLength: 0.19,
      tailLength: 0.32,
      tailHeight: 0.29,
      dorsalHeight: 0.15,
      ventralHeight: 0.08,
      pectoralSize: 0.13,
      eyeScale: 0.05,
      mouthScale: 0.045,
      finOpacity: 0.78,
      hasBarbels: false,
      hasFeelers: false,
    };
  }

  if (includesAny(name, ["gourami"])) {
    return {
      bodyStyle: "deep",
      tailStyle: "rounded",
      pattern,
      bodyHalfLength: 0.34,
      bodyHeight: 0.24,
      bodyDepth: 0.125,
      headLength: 0.19,
      tailLength: 0.22,
      tailHeight: 0.2,
      dorsalHeight: 0.14,
      ventralHeight: 0.15,
      pectoralSize: 0.12,
      eyeScale: 0.045,
      mouthScale: 0.04,
      finOpacity: 0.76,
      hasBarbels: false,
      hasFeelers: true,
    };
  }

  if (
    includesAny(name, ["cichlid", "ram", "acara", "oscar"]) ||
    species.biotope_region === "lake_malawi"
  ) {
    return {
      bodyStyle: "deep",
      tailStyle: "rounded",
      pattern,
      bodyHalfLength: 0.35,
      bodyHeight: 0.225,
      bodyDepth: 0.135,
      headLength: 0.2,
      tailLength: 0.23,
      tailHeight: 0.2,
      dorsalHeight: 0.15,
      ventralHeight: 0.1,
      pectoralSize: 0.13,
      eyeScale: 0.045,
      mouthScale: species.predatory ? 0.055 : 0.04,
      finOpacity: 0.8,
      hasBarbels: false,
      hasFeelers: false,
    };
  }

  if (species.predatory) {
    return {
      bodyStyle: "predator",
      tailStyle: "forked",
      pattern,
      bodyHalfLength: 0.45,
      bodyHeight: 0.15,
      bodyDepth: 0.12,
      headLength: 0.24,
      tailLength: 0.27,
      tailHeight: 0.18,
      dorsalHeight: 0.1,
      ventralHeight: 0.07,
      pectoralSize: 0.1,
      eyeScale: 0.04,
      mouthScale: 0.06,
      finOpacity: 0.84,
      hasBarbels: false,
      hasFeelers: false,
    };
  }

  if (includesAny(name, ["guppy", "endler", "swordtail"])) {
    return {
      bodyStyle: "streamlined",
      tailStyle: "fan",
      pattern: pattern === "none" ? "spots" : pattern,
      bodyHalfLength: 0.37,
      bodyHeight: 0.145,
      bodyDepth: 0.1,
      headLength: 0.17,
      tailLength: 0.3,
      tailHeight: 0.27,
      dorsalHeight: 0.11,
      ventralHeight: 0.06,
      pectoralSize: 0.08,
      eyeScale: 0.04,
      mouthScale: 0.035,
      finOpacity: 0.74,
      hasBarbels: false,
      hasFeelers: false,
    };
  }

  const activeScale = species.active ? 1 : 0.92;
  return {
    bodyStyle: "streamlined",
    tailStyle: species.active ? "forked" : "rounded",
    pattern,
    bodyHalfLength: 0.4 * activeScale,
    bodyHeight: species.active ? 0.135 : 0.17,
    bodyDepth: species.active ? 0.095 : 0.115,
    headLength: 0.18,
    tailLength: species.active ? 0.26 : 0.22,
    tailHeight: species.active ? 0.18 : 0.19,
    dorsalHeight: 0.1,
    ventralHeight: 0.06,
    pectoralSize: 0.09,
    eyeScale: 0.04,
    mouthScale: 0.035,
    finOpacity: 0.8,
    hasBarbels: false,
    hasFeelers: false,
  };
}
