import { BIOTOPE_LABEL, BIOTOPE_WATER, type BiotopeRegion, type TankState } from "../types";

export interface SubScore {
  score: number;
  reasons: string[];
  fixes: string[];
}

export interface Scorecard {
  overall: number;
  compatibility: SubScore;
  bioload: SubScore & { loadPercent: number };
  space: SubScore;
  biome: SubScore & { badge?: "true-biotope"; dominantRegion?: BiotopeRegion };
  legality: SubScore & { illegalSpecies: string[] };
}

export const WEIGHTS = {
  compatibility: 0.25,
  bioload: 0.2,
  space: 0.2,
  biome: 0.25,
  legality: 0.1,
} as const;

export function litresOf(state: Pick<TankState, "length_cm" | "width_cm" | "height_cm">) {
  return (state.length_cm * state.width_cm * state.height_cm) / 1000;
}

export function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

const empty: SubScore = { score: 100, reasons: [], fixes: [] };

export function scoreTank(state: TankState): Scorecard {
  const compatibility = scoreCompatibility(state);
  const bioload = scoreBioload(state);
  const space = scoreSpace(state);
  const biome = scoreBiome(state);
  const legality = scoreLegality(state);

  const overall = Math.round(
    compatibility.score * WEIGHTS.compatibility +
      bioload.score * WEIGHTS.bioload +
      space.score * WEIGHTS.space +
      biome.score * WEIGHTS.biome +
      legality.score * WEIGHTS.legality,
  );

  return { overall, compatibility, bioload, space, biome, legality };
}

// ============== 1. COMPATIBILITY ==============
function scoreCompatibility(state: TankState): SubScore {
  if (state.species.length === 0) return { ...empty };
  let score = 100;
  const reasons: string[] = [];
  const fixes: string[] = [];

  // Schooling shortfall
  for (const { species: sp, quantity } of state.species) {
    if (sp.is_schooling && quantity < sp.min_group_size) {
      score -= 12;
      reasons.push(
        `${sp.common_name} is a schooling fish and needs at least ${sp.min_group_size} — you have ${quantity}.`,
      );
      fixes.push(
        `Add ${sp.min_group_size - quantity} more ${sp.common_name} to reach the school minimum.`,
      );
    }
  }

  // Pairwise checks
  const list = state.species;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i].species;
      const b = list[j].species;

      // temperament clash
      const aggr = (t: string) => (t === "aggressive" ? 2 : t === "semi-aggressive" ? 1 : 0);
      if (Math.abs(aggr(a.temperament) - aggr(b.temperament)) >= 2) {
        score -= 15;
        reasons.push(`${a.common_name} and ${b.common_name} have clashing temperaments.`);
        fixes.push(`Remove one of ${a.common_name} or ${b.common_name}.`);
      }

      // fin nipper + long-finned
      if ((a.fin_nipper && b.long_finned) || (b.fin_nipper && a.long_finned)) {
        score -= 15;
        const nipper = a.fin_nipper ? a : b;
        const finned = a.long_finned ? a : b;
        reasons.push(`${nipper.common_name} tends to nip ${finned.common_name}'s long fins.`);
        fixes.push(`Swap ${nipper.common_name} for a non fin-nipping species.`);
      }

      // predator vs small tankmate
      const predatorPreySize = (p: typeof a, prey: typeof a) =>
        p.predatory && prey.adult_size_cm * 2.5 <= p.adult_size_cm;
      if (predatorPreySize(a, b) || predatorPreySize(b, a)) {
        score -= 25;
        const p = a.predatory ? a : b;
        const pr = a.predatory ? b : a;
        reasons.push(`${p.common_name} will likely eat ${pr.common_name}.`);
        fixes.push(`Remove ${pr.common_name} or ${p.common_name}.`);
      }

      // pH range non-overlap
      if (a.native_ph_max < b.native_ph_min || b.native_ph_max < a.native_ph_min) {
        score -= 10;
        reasons.push(
          `${a.common_name} and ${b.common_name} prefer different pH ranges.`,
        );
        fixes.push(`Pick species with overlapping pH preferences.`);
      }

      // temp non-overlap
      if (a.native_temp_max_c < b.native_temp_min_c || b.native_temp_max_c < a.native_temp_min_c) {
        score -= 10;
        reasons.push(
          `${a.common_name} and ${b.common_name} prefer different temperatures.`,
        );
        fixes.push(`Pick species with overlapping temperature preferences.`);
      }
    }
  }

  if (reasons.length === 0) reasons.push("All added species get along.");
  return { score: clamp(score), reasons, fixes };
}

// ============== 2. BIOLOAD ==============
function scoreBioload(state: TankState): SubScore & { loadPercent: number } {
  const litres = litresOf(state);
  if (litres === 0) return { score: 0, reasons: ["Set your tank dimensions first."], fixes: [], loadPercent: 0 };

  const turnoverLph = state.filter?.turnover_lph ?? 0;
  const turnoverRatio = litres > 0 ? turnoverLph / litres : 0;
  // filter factor: 4x turnover = 1.0, scale linearly, cap between 0.4 and 1.4
  const filterFactor = clamp(0.4 + (turnoverRatio / 4) * 0.7, 0.4, 1.4) / 1;

  const plantFactor = {
    none: 1.0,
    light: 1.05,
    medium: 1.12,
    heavy: 1.2,
  }[state.plant_density];

  const maintenanceFactor = {
    weekly: 1.1,
    fortnightly: 1.0,
    monthly: 0.85,
  }[state.maintenance_frequency];

  // Capacity: roughly 1 bioload unit per 5 L in a baseline tank
  const capacity = (litres / 5) * filterFactor * plantFactor * maintenanceFactor;

  const load = state.species.reduce(
    (s, x) => s + x.species.bioload_factor * x.quantity,
    0,
  );
  const loadPercent = capacity > 0 ? Math.round((load / capacity) * 100) : 0;

  // Ideal band: 70-85%
  let score = 100;
  if (loadPercent < 40) score = 70 + loadPercent * 0.5;
  else if (loadPercent <= 70) score = 85 + (loadPercent - 40);
  else if (loadPercent <= 85) score = 100;
  else if (loadPercent <= 100) score = 100 - (loadPercent - 85) * 2;
  else if (loadPercent <= 130) score = 70 - (loadPercent - 100) * 2;
  else score = Math.max(0, 10 - (loadPercent - 130));

  const reasons: string[] = [];
  const fixes: string[] = [];
  if (state.species.length === 0) reasons.push("No fish added yet.");
  else if (loadPercent > 100) {
    reasons.push(`Bioload is at ${loadPercent}% of capacity — the tank is overstocked.`);
    fixes.push("Remove some fish, upgrade the filter, or increase water change frequency.");
  } else if (loadPercent < 40) {
    reasons.push(`Bioload is only ${loadPercent}% of capacity — you have room to add more.`);
  } else {
    reasons.push(`Bioload is at ${loadPercent}% of capacity — a healthy buffer.`);
  }
  if (!state.filter) {
    reasons.push("No filter selected.");
    fixes.push("Pick a filter rated for at least your tank's litres.");
  } else if (state.filter.rated_litres < litres) {
    fixes.push(`This filter is rated for ${state.filter.rated_litres} L but the tank is ${Math.round(litres)} L.`);
  }

  return { score: Math.round(clamp(score)), reasons, fixes, loadPercent };
}

// ============== 3. SPACE ==============
function scoreSpace(state: TankState): SubScore {
  if (state.species.length === 0) return { ...empty };
  const litres = litresOf(state);
  const length = state.length_cm;
  let score = 100;
  const reasons: string[] = [];
  const fixes: string[] = [];

  for (const { species: sp, quantity } of state.species) {
    if (litres < sp.min_tank_litres) {
      const gap = sp.min_tank_litres - litres;
      score -= 15 + Math.min(20, gap / 10);
      reasons.push(
        `${sp.common_name} needs at least ${sp.min_tank_litres} L — this tank is ${Math.round(litres)} L.`,
      );
      fixes.push(`Move ${sp.common_name} to a bigger tank or remove it.`);
    }
    const requiredLength = sp.adult_size_cm * (sp.active ? 6 : 4);
    if (length < requiredLength) {
      score -= 10;
      reasons.push(
        `${sp.common_name} needs about ${requiredLength} cm of swimming length — your tank is ${length} cm.`,
      );
      fixes.push(`Use a longer tank (at least ${requiredLength} cm) for ${sp.common_name}.`);
    }
    // Heavy stocking of large species
    if (sp.adult_size_cm >= 15 && quantity > 1 && litres / quantity < sp.min_tank_litres) {
      score -= 5;
    }
  }

  if (reasons.length === 0) reasons.push("Every species has enough room to swim.");
  return { score: clamp(score), reasons, fixes };
}

// ============== 4. BIOME ==============
function scoreBiome(
  state: TankState,
): SubScore & { badge?: "true-biotope"; dominantRegion?: BiotopeRegion } {
  if (state.species.length === 0)
    return { ...empty, score: 0, reasons: ["Add some fish to score biome replication."] };

  // Dominant region by headcount share
  const counts: Record<string, number> = {};
  let total = 0;
  for (const { species: sp, quantity } of state.species) {
    counts[sp.biotope_region] = (counts[sp.biotope_region] ?? 0) + quantity;
    total += quantity;
  }
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as BiotopeRegion;
  const cohesion = counts[dominant] / total; // 0..1

  // Water authenticity
  const water = BIOTOPE_WATER[dominant];
  const phFit = state.target_ph >= water.ph_min && state.target_ph <= water.ph_max ? 1 : Math.max(0, 1 - Math.min(Math.abs(state.target_ph - water.ph_min), Math.abs(state.target_ph - water.ph_max)) / 2);
  const tempFit = state.target_temp_c >= water.temp_min && state.target_temp_c <= water.temp_max ? 1 : Math.max(0, 1 - Math.min(Math.abs(state.target_temp_c - water.temp_min), Math.abs(state.target_temp_c - water.temp_max)) / 4);
  const waterAuthenticity = (phFit + tempFit) / 2;

  // Hardscape match
  const hardscapeMatch = state.hardscape.length === 0
    ? 0.5
    : state.hardscape.filter((h) => h.hardscape.biotope_region === dominant).length / state.hardscape.length;

  // Plant match
  const plantMatch = state.plants.length === 0
    ? 0.5
    : state.plants.filter((p) => p.plant.biotope_region === dominant).length / state.plants.length;

  const raw = cohesion * 45 + waterAuthenticity * 25 + hardscapeMatch * 15 + plantMatch * 15;
  const score = Math.round(clamp(raw));

  const reasons: string[] = [];
  const fixes: string[] = [];
  const { BIOTOPE_LABEL } = require("../types") as typeof import("../types");
  const dominantLabel = BIOTOPE_LABEL[dominant];

  reasons.push(`Dominant biotope: ${dominantLabel} (${Math.round(cohesion * 100)}% of stock).`);
  if (cohesion < 1) fixes.push(`Remove species from other biotopes to strengthen the ${dominantLabel} theme.`);
  if (waterAuthenticity < 0.8) fixes.push(`Adjust target pH and temperature toward ${dominantLabel} ranges (${water.ph_min}–${water.ph_max} pH, ${water.temp_min}–${water.temp_max}°C).`);
  if (hardscapeMatch < 0.7) fixes.push(`Swap hardscape for items from the ${dominantLabel} region.`);
  if (plantMatch < 0.7) fixes.push(`Swap plants for species from the ${dominantLabel} region.`);

  const allOneRegion = cohesion === 1;
  const badge = allOneRegion && score >= 85 ? "true-biotope" : undefined;

  return { score, reasons, fixes, badge, dominantRegion: dominant };
}

// ============== 5. LEGALITY ==============
function scoreLegality(state: TankState): SubScore & { illegalSpecies: string[] } {
  const illegal = state.species
    .map((s) => s.species)
    .filter((s) => !s.legal_in_australia);

  if (illegal.length === 0) {
    return {
      score: 100,
      reasons: ["All added species are legal to keep in Australia."],
      fixes: [],
      illegalSpecies: [],
    };
  }
  const score = clamp(100 - 60 * illegal.length);
  const names = illegal.map((s) => s.common_name);
  return {
    score,
    reasons: [
      `${names.join(", ")} ${illegal.length === 1 ? "is" : "are"} restricted and cannot be legally imported or kept in Australia.`,
    ],
    fixes: [`Remove ${names.join(" and ")}.`],
    illegalSpecies: names,
  };
}
