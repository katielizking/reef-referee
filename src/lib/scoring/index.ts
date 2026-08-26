import { BIOTOPE_LABEL, BIOTOPE_WATER, type BiotopeRegion, type TankState } from "../types";

export interface SubScore {
  score: number;
  reasons: string[];
  fixes: string[];
  issues?: Issue[];
}

export type IssueCode =
  | "shoal-shortfall"
  | "conspecific-partial-group"
  | "conspecific-aggression"
  | "conspecific-territorial"
  | "aggression-standing"
  | "both-aggressive"
  | "temperament-clash"
  | "both-territorial"
  | "fin-nipping"
  | "fin-nipping-understocked"
  | "predation"
  | "ph-no-overlap"
  | "ph-marginal"
  | "temp-no-overlap"
  | "temp-marginal"
  | "tank-too-small"
  | "tank-too-short"
  | "footprint-crowded"
  | "ph-unsuitable"
  | "temp-unsuitable";

/** Issue codes that a user resolves by changing how many of one species they keep. */
export const GROUP_CODES: ReadonlySet<IssueCode> = new Set<IssueCode>([
  "shoal-shortfall",
  "conspecific-partial-group",
  "conspecific-aggression",
  "conspecific-territorial",
]);

export interface Issue {
  code: IssueCode;
  severity: "critical" | "high" | "medium" | "low";
  category: "compatibility" | "bioload" | "space" | "water" | "biome";
  weight: number;
  reason: string;
  fix: string;
}

export interface CompatibilitySubScore extends SubScore {
  criticalConflicts: string[];
  issues: Issue[];
}

export interface PriorityAction {
  severity: "critical" | "high" | "medium";
  category: "compatibility" | "bioload" | "space" | "water" | "biome";
  title: string;
  action: string;
}

export interface Scorecard {
  overall: number | null;
  capReason: string | null;
  priorityAction: PriorityAction | null;
  compatibility: CompatibilitySubScore;
  bioload: SubScore & { loadPercent: number; headroom: string | null };
  space: SubScore;
  water: SubScore & { misfits: string[] };
  /** Informational only. Biotope authenticity is a style goal, not a welfare measure,
   *  so it is reported beside the score and never folded into it. */
  biome: SubScore & { badge?: "true-biotope"; dominantRegion?: BiotopeRegion };
}

/** Welfare weights. Biotope is deliberately absent: see Scorecard.biome. */
export const WEIGHTS = {
  compatibility: 0.35,
  bioload: 0.25,
  space: 0.25,
  water: 0.15,
} as const;

/** Load at or below this share of capacity is a healthy tank, not a better one. */
export const BIOLOAD_PLATEAU = 85;
/** Score lost per percentage point of load above the plateau. */
export const BIOLOAD_DECAY = 2.2;

export function litresOf(state: Pick<TankState, "length_cm" | "width_cm" | "height_cm">) {
  return (state.length_cm * state.width_cm * state.height_cm) / 1000;
}

export function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

const empty: SubScore = { score: 100, reasons: [], fixes: [] };

/**
 * Aggregate issue weights so that many small problems cannot sum past a single
 * severe one, and a six-species community is not punished simply for having
 * fifteen pairs to check. Each successive issue counts for less.
 */
function aggregate(issues: Issue[]): number {
  const ordered = [...issues].sort((a, b) => b.weight - a.weight);
  let penalty = 0;
  ordered.forEach((issue, i) => {
    penalty += issue.weight * Math.pow(0.72, i);
  });
  return clamp(100 - penalty);
}

export function scoreTank(state: TankState): Scorecard {
  const compatibility = scoreCompatibility(state);
  const bioload = scoreBioload(state);
  const space = scoreSpace(state);
  const water = scoreWater(state);
  const biome = scoreBiome(state);

  if (state.species.length === 0) {
    return {
      overall: null,
      capReason: null,
      priorityAction: null,
      compatibility,
      bioload,
      space,
      water,
      biome,
    };
  }

  const weighted = Math.round(
    compatibility.score * WEIGHTS.compatibility +
      bioload.score * WEIGHTS.bioload +
      space.score * WEIGHTS.space +
      water.score * WEIGHTS.water,
  );

  const caps: Array<{ cap: number; reason: string }> = [];
  if (bioload.loadPercent > 110) {
    caps.push({ cap: 45, reason: "Score capped: the tank is overstocked beyond safe limits." });
  }
  if (compatibility.criticalConflicts.length > 0) {
    caps.push({ cap: 40, reason: "Score capped: a critical compatibility conflict will cost fish their lives." });
  }

  let overall = weighted;
  let capReason: string | null = null;
  if (caps.length > 0) {
    const lowest = caps.reduce((a, b) => (a.cap <= b.cap ? a : b));
    overall = Math.min(weighted, lowest.cap);
    capReason = lowest.reason;
  }

  return {
    overall,
    capReason,
    priorityAction: choosePriorityAction({ compatibility, bioload, space, water, biome }),
    compatibility,
    bioload,
    space,
    water,
    biome,
  };
}

function choosePriorityAction(
  scores: Pick<Scorecard, "compatibility" | "bioload" | "space" | "water" | "biome">,
): PriorityAction | null {
  const critical = scores.compatibility.issues.find((i) => i.severity === "critical");
  if (critical) {
    return {
      severity: "critical",
      category: "compatibility",
      title: "Fix this before you buy anything",
      action: critical.fix,
    };
  }
  if (scores.bioload.loadPercent > 110) {
    return {
      severity: "critical",
      category: "bioload",
      title: "Reduce the stocking load first",
      action: scores.bioload.fixes[0] ?? "Reduce fish numbers, increase tank volume or improve filtration.",
    };
  }
  if (scores.water.score < 70 && scores.water.fixes.length > 0) {
    return { severity: "high", category: "water", title: "Your water settings do not suit these fish", action: scores.water.fixes[0] };
  }
  if (scores.space.score < 60 && scores.space.fixes.length > 0) {
    return { severity: "high", category: "space", title: "Fix the swimming-space problem first", action: scores.space.fixes[0] };
  }
  const high = scores.compatibility.issues.find((i) => i.severity === "high");
  if (high) {
    return { severity: "high", category: "compatibility", title: "Improve compatibility first", action: high.fix };
  }
  if (scores.bioload.loadPercent > 95 && scores.bioload.fixes.length > 0) {
    return { severity: "medium", category: "bioload", title: "Create more biological headroom", action: scores.bioload.fixes[0] };
  }
  return null;
}

// ============== 1. COMPATIBILITY ==============

const AGGRESSION: Record<string, number> = { peaceful: 0, "semi-aggressive": 1, aggressive: 2 };

function scoreCompatibility(state: TankState): CompatibilitySubScore {
  if (state.species.length === 0) return { ...empty, criticalConflicts: [], issues: [] };

  const issues: Issue[] = [];
  const criticalConflicts: string[] = [];
  const add = (code: IssueCode, severity: Issue["severity"], weight: number, reason: string, fix: string) =>
    issues.push({ code, severity, category: "compatibility", weight, reason, fix });

  // --- same-species rules. A row can now conflict with itself. ---
  for (const { species: sp, quantity } of state.species) {
    if (sp.is_schooling && quantity < sp.min_group_size) {
      const short = sp.min_group_size - quantity;
      add(
        "shoal-shortfall",
        quantity === 1 ? "high" : "medium",
        quantity === 1 ? 18 : 12,
        `${sp.common_name} is a shoaling fish kept in ${quantity}. It needs at least ${sp.min_group_size} to feel secure.`,
        `Add ${short} more ${sp.common_name}.`,
      );
    }

    // Aggressive or territorial species kept in small same-species groups fight
    // each other. This is the single most common cause of a dead fish in a
    // community tank, and it never involves a second species.
    //
    // An aggressive species in a partial group is the worst case of all: mbuna
    // and similar fish are kept either singly or in a crowd large enough to
    // spread the aggression, never in twos and threes.
    if (sp.is_schooling && sp.temperament === "aggressive" && quantity > 1 && quantity < sp.min_group_size) {
      add(
        "conspecific-partial-group",
        "critical",
        50,
        `${sp.common_name} is aggressive towards its own kind. In a part-group of ${quantity} the aggression lands on one fish instead of being spread across a full group of ${sp.min_group_size} or more.`,
        `Keep a single ${sp.common_name}, or commit to a full group of at least ${sp.min_group_size}.`,
      );
      criticalConflicts.push(`${sp.common_name} × ${quantity}`);
    }

    // Any aggressive species held in a group carries standing risk. Reaching a
    // nominal group size does not make the risk go away, it only changes who
    // absorbs it, so the caution stands rather than clearing at a threshold.
    if (sp.is_schooling && sp.temperament === "aggressive" && quantity >= sp.min_group_size && quantity > 1) {
      add(
        "aggression-standing",
        "medium",
        14,
        `${sp.common_name} stays aggressive towards its own kind even in a full group. Groups like this need a large tank, heavy hardscape and, usually, no other species.`,
        `Plan this as a species-only tank, break up sight lines with rock, and watch for one fish being singled out.`,
      );
    }

    if (!sp.is_schooling && quantity > 1) {
      if (sp.temperament === "aggressive") {
        add(
          "conspecific-aggression",
          "critical",
          55,
          `${sp.common_name} is aggressive towards its own kind. Keeping ${quantity} together will end in serious injury or death.`,
          `Keep a single ${sp.common_name}, or house the others in separate tanks.`,
        );
        criticalConflicts.push(`${sp.common_name} × ${quantity}`);
      } else if (sp.temperament === "semi-aggressive" && quantity < 4) {
        add(
          "conspecific-territorial",
          "high",
          22,
          `${sp.common_name} is territorial. In a group of ${quantity} the weakest fish has nowhere to hide.`,
          `Keep one ${sp.common_name}, or a larger group of at least 4 so aggression is spread.`,
        );
      }
    }
  }

  // --- pairwise rules ---
  const list = state.species;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i].species;
      const b = list[j].species;
      const qa = list[i].quantity;
      const qb = list[j].quantity;

      // Temperament. A gap of two is the classic mismatch, but two aggressive
      // species together is usually worse, and the old rule scored it zero.
      const ga = AGGRESSION[a.temperament] ?? 0;
      const gb = AGGRESSION[b.temperament] ?? 0;
      if (ga === 2 && gb === 2) {
        add(
          "both-aggressive",
          "critical",
          45,
          `${a.common_name} and ${b.common_name} are both aggressive. Neither will back down.`,
          `Keep only one of ${a.common_name} or ${b.common_name}.`,
        );
        criticalConflicts.push(`${a.common_name} ⇄ ${b.common_name}`);
      } else if (Math.abs(ga - gb) >= 2) {
        add(
          "temperament-clash",
          "high",
          24,
          `${a.common_name} and ${b.common_name} have clashing temperaments.`,
          `Remove one of ${a.common_name} or ${b.common_name}.`,
        );
      } else if (ga === 1 && gb === 1) {
        add(
          "both-territorial",
          "medium",
          8,
          `${a.common_name} and ${b.common_name} are both territorial. Give them separate hiding places and broken sight lines.`,
          `Add more hardscape so each has its own territory.`,
        );
      }

      // Fin nipping. Seriously Fish is explicit that nipping is pronounced when
      // numbers are too low, so the flag is conditional rather than permanent.
      const nipPair = (n: typeof a, nq: number, f: typeof a) => {
        if (!n.fin_nipper || !f.long_finned) return;
        const understocked = n.is_schooling && nq < n.min_group_size;
        if (understocked) {
          add(
            "fin-nipping-understocked",
            "high",
            22,
            `${n.common_name} nips fins when kept in small numbers, and ${f.common_name} has long fins to nip.`,
            `Raise ${n.common_name} to at least ${n.min_group_size} so they occupy each other, or remove ${f.common_name}.`,
          );
        } else {
          add(
            "fin-nipping",
            "medium",
            10,
            `${n.common_name} may nip ${f.common_name}'s long fins. Watch for frayed edges.`,
            `Keep ${n.common_name} in a full group and give ${f.common_name} cover to retreat to.`,
          );
        }
      };
      nipPair(a, qa, b);
      nipPair(b, qb, a);

      // Predation. Judged on the smaller fish's adult size, which is the size it
      // has to survive to reach.
      const eats = (p: typeof a, prey: typeof a) => p.predatory && prey.adult_size_cm * 2.5 <= p.adult_size_cm;
      if (eats(a, b) || eats(b, a)) {
        const p = eats(a, b) ? a : b;
        const prey = eats(a, b) ? b : a;
        add(
          "predation",
          "critical",
          60,
          `${p.common_name} is large enough to swallow ${prey.common_name}.`,
          `Remove ${prey.common_name}, or rehome ${p.common_name}.`,
        );
        criticalConflicts.push(`${p.common_name} → ${prey.common_name}`);
      }

      // Parameter overlap, with a margin. A single degree or a tenth of a pH
      // point of overlap is not a shared range, it is a coincidence.
      const phOverlap = Math.min(a.native_ph_max, b.native_ph_max) - Math.max(a.native_ph_min, b.native_ph_min);
      if (phOverlap < 0) {
        add("ph-no-overlap", "high", 20, `${a.common_name} and ${b.common_name} need different water chemistry, with no shared pH at all.`, `Pick species with overlapping pH ranges.`);
      } else if (phOverlap < 0.5) {
        add("ph-marginal", "medium", 9, `${a.common_name} and ${b.common_name} only just overlap on pH.`, `Aim for species with at least half a pH point in common.`);
      }

      const tOverlap = Math.min(a.native_temp_max_c, b.native_temp_max_c) - Math.max(a.native_temp_min_c, b.native_temp_min_c);
      if (tOverlap < 0) {
        add("temp-no-overlap", "high", 20, `${a.common_name} and ${b.common_name} need different temperatures, with no shared range at all.`, `Pick species with overlapping temperature ranges.`);
      } else if (tOverlap < 2) {
        add("temp-marginal", "medium", 9, `${a.common_name} and ${b.common_name} share only ${tOverlap.toFixed(1)} °C of comfortable range.`, `Aim for at least 2 °C of overlap so the tank has somewhere safe to sit.`);
      }
    }
  }

  const score = aggregate(issues);
  const reasons = issues.length ? issues.map((i) => i.reason) : ["Every species in this tank gets along."];
  const fixes = issues.map((i) => i.fix);
  return { score, reasons, fixes, criticalConflicts, issues };
}

// ============== 2. BIOLOAD ==============

function scoreBioload(state: TankState): SubScore & { loadPercent: number; headroom: string | null } {
  const litres = litresOf(state);
  if (litres === 0) {
    return { score: 0, reasons: ["Set your tank dimensions first."], fixes: [], loadPercent: 0, headroom: null };
  }

  const turnoverLph = state.filter?.turnover_lph ?? 0;
  const turnoverRatio = turnoverLph / litres;
  const filterFactor = clamp(0.4 + (turnoverRatio / 4) * 0.7, 0.4, 1.4);
  const plantFactor = { none: 1.0, light: 1.05, medium: 1.12, heavy: 1.2 }[state.plant_density];
  const maintenanceFactor = { weekly: 1.1, fortnightly: 1.0, monthly: 0.85 }[state.maintenance_frequency];

  const capacity = (litres / 5) * filterFactor * plantFactor * maintenanceFactor;
  const load = state.species.reduce((s, x) => s + x.species.bioload_factor * x.quantity, 0);
  const loadPercent = capacity > 0 ? Math.round((load / capacity) * 100) : 0;

  // Monotonic by design. A lightly stocked tank is never a worse tank, so
  // spare capacity is reported as headroom and never deducted. Adding fish can
  // only ever hold the score steady or lower it.
  const score = Math.round(
    loadPercent <= BIOLOAD_PLATEAU ? 100 : clamp(100 - (loadPercent - BIOLOAD_PLATEAU) * BIOLOAD_DECAY),
  );

  const reasons: string[] = [];
  const fixes: string[] = [];
  let headroom: string | null = null;

  if (state.species.length === 0) {
    reasons.push("No fish added yet.");
  } else if (loadPercent > 100) {
    reasons.push(`Bioload is at ${loadPercent}% of capacity. The tank is overstocked.`);
    fixes.push("Remove some fish, upgrade the filter, or move to weekly water changes.");
  } else if (loadPercent > BIOLOAD_PLATEAU) {
    reasons.push(`Bioload is at ${loadPercent}% of capacity, which leaves very little margin for error.`);
    fixes.push("Hold off on adding anything else, and keep water changes weekly.");
  } else {
    reasons.push(`Bioload is at ${loadPercent}% of capacity.`);
    // Deliberately qualitative. The capacity model behind loadPercent is still
    // the inherited litres/5 rule and has never been calibrated against real
    // tanks, so quoting "room for 33 more fish" would imply a precision we do
    // not have, to exactly the beginner most likely to act on it.
    if (loadPercent < 50) headroom = "There is comfortable room to add more once the tank is mature.";
    else if (loadPercent < 70) headroom = "There is a little room left, so add slowly and one species at a time.";
    else headroom = "This is close to a comfortable limit. Treat it as full.";
  }

  if (!state.filter) {
    reasons.push("No filter selected.");
    fixes.push("Pick a filter rated for at least your tank's litres.");
  } else if (state.filter.rated_litres < litres) {
    fixes.push(`This filter is rated for ${state.filter.rated_litres} L but the tank is ${Math.round(litres)} L.`);
  }

  return { score, reasons, fixes, loadPercent, headroom };
}

// ============== 3. SPACE ==============

function scoreSpace(state: TankState): SubScore {
  if (state.species.length === 0) return { ...empty };
  const litres = litresOf(state);
  const length = state.length_cm;
  const issues: Issue[] = [];
  const add = (code: IssueCode, severity: Issue["severity"], weight: number, reason: string, fix: string) =>
    issues.push({ code, severity, category: "space", weight, reason, fix });

  for (const { species: sp, quantity } of state.species) {
    if (litres < sp.min_tank_litres) {
      const shortfall = (sp.min_tank_litres - litres) / sp.min_tank_litres;
      add(
        "tank-too-small",
        shortfall > 0.4 ? "critical" : "high",
        clamp(18 + shortfall * 40, 0, 55),
        `${sp.common_name} needs at least ${sp.min_tank_litres} L. This tank is ${Math.round(litres)} L.`,
        `Move ${sp.common_name} to a bigger tank, or choose a smaller species.`,
      );
    }
    const requiredLength = sp.adult_size_cm * (sp.active ? 6 : 4);
    if (length < requiredLength) {
      add(
        "tank-too-short",
        "medium",
        12,
        `${sp.common_name} wants about ${Math.round(requiredLength)} cm of swimming length. This tank is ${length} cm.`,
        `Use a longer tank, at least ${Math.round(requiredLength)} cm, for ${sp.common_name}.`,
      );
    }
    if (sp.adult_size_cm >= 15 && quantity > 1 && litres / quantity < sp.min_tank_litres) {
      add("footprint-crowded", "medium", 10, `${quantity} × ${sp.common_name} at that adult size crowds this footprint.`, `Reduce the group, or increase the tank footprint.`);
    }
  }

  const score = aggregate(issues);
  const reasons = issues.length ? issues.map((i) => i.reason) : ["Every species has enough room to swim."];
  return { score, reasons, fixes: issues.map((i) => i.fix), issues };
}

// ============== 4. WATER ==============

/**
 * Does the tank the user is actually planning suit the fish they are actually
 * adding? Nothing asked this before: pH and temperature only ever mattered
 * between two species, never between a species and its tank.
 */
function scoreWater(state: TankState): SubScore & { misfits: string[] } {
  if (state.species.length === 0) return { ...empty, misfits: [] };

  const issues: Issue[] = [];
  const misfits: string[] = [];
  const add = (code: IssueCode, severity: Issue["severity"], weight: number, reason: string, fix: string) =>
    issues.push({ code, severity, category: "water", weight, reason, fix });

  for (const { species: sp } of state.species) {
    const phGap =
      state.target_ph < sp.native_ph_min
        ? sp.native_ph_min - state.target_ph
        : state.target_ph > sp.native_ph_max
          ? state.target_ph - sp.native_ph_max
          : 0;
    const tempGap =
      state.target_temp_c < sp.native_temp_min_c
        ? sp.native_temp_min_c - state.target_temp_c
        : state.target_temp_c > sp.native_temp_max_c
          ? state.target_temp_c - sp.native_temp_max_c
          : 0;

    if (phGap > 0) {
      misfits.push(sp.common_name);
      add(
        "ph-unsuitable",
        phGap >= 1 ? "high" : "medium",
        clamp(10 + phGap * 14, 0, 45),
        `Your target pH of ${state.target_ph} sits outside ${sp.common_name}'s range of ${sp.native_ph_min}–${sp.native_ph_max}.`,
        `Set the tank between ${sp.native_ph_min} and ${sp.native_ph_max} pH, or choose a species suited to ${state.target_ph}.`,
      );
    }
    if (tempGap > 0) {
      if (!misfits.includes(sp.common_name)) misfits.push(sp.common_name);
      add(
        "temp-unsuitable",
        tempGap >= 2 ? "high" : "medium",
        clamp(10 + tempGap * 12, 0, 45),
        `Your target temperature of ${state.target_temp_c} °C sits outside ${sp.common_name}'s range of ${sp.native_temp_min_c}–${sp.native_temp_max_c} °C.`,
        `Set the tank between ${sp.native_temp_min_c} and ${sp.native_temp_max_c} °C, or choose a species suited to ${state.target_temp_c} °C.`,
      );
    }
  }

  const score = aggregate(issues);
  const reasons = issues.length ? issues.map((i) => i.reason) : ["Your water settings suit every species in the tank."];
  return { score, reasons, fixes: issues.map((i) => i.fix), misfits, issues };
}

// ============== 5. BIOME (informational) ==============

function scoreBiome(state: TankState): SubScore & { badge?: "true-biotope"; dominantRegion?: BiotopeRegion } {
  if (state.species.length === 0) {
    return { ...empty, score: 0, reasons: ["Add some fish to score biotope replication."] };
  }

  const counts: Record<string, number> = {};
  let total = 0;
  for (const { species: sp, quantity } of state.species) {
    counts[sp.biotope_region] = (counts[sp.biotope_region] ?? 0) + quantity;
    total += quantity;
  }
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as BiotopeRegion;

  // "unmapped" is a bucket for species we have not placed, not a habitat.
  // Treating it as cohesive handed a true-biotope badge to tanks spanning
  // three continents, so it now scores zero cohesion and can never win a badge.
  const mapped = dominant !== "unmapped";
  const cohesion = mapped ? counts[dominant] / total : 0;
  const unmappedShare = (counts["unmapped"] ?? 0) / total;

  const water = BIOTOPE_WATER[dominant];
  const phFit =
    state.target_ph >= water.ph_min && state.target_ph <= water.ph_max
      ? 1
      : Math.max(0, 1 - Math.min(Math.abs(state.target_ph - water.ph_min), Math.abs(state.target_ph - water.ph_max)) / 2);
  const tempFit =
    state.target_temp_c >= water.temp_min && state.target_temp_c <= water.temp_max
      ? 1
      : Math.max(0, 1 - Math.min(Math.abs(state.target_temp_c - water.temp_min), Math.abs(state.target_temp_c - water.temp_max)) / 4);
  const waterAuthenticity = mapped ? (phFit + tempFit) / 2 : 0;

  const hardscapeMatch =
    !mapped || state.hardscape.length === 0
      ? 0.5
      : state.hardscape.filter((h) => h.hardscape.biotope_region === dominant).length / state.hardscape.length;
  const plantMatch =
    !mapped || state.plants.length === 0
      ? 0.5
      : state.plants.filter((p) => p.plant.biotope_region === dominant).length / state.plants.length;

  const raw = cohesion * 45 + waterAuthenticity * 25 + hardscapeMatch * 15 + plantMatch * 15;
  const score = Math.round(clamp(raw));

  const reasons: string[] = [];
  const fixes: string[] = [];
  const dominantLabel = BIOTOPE_LABEL[dominant];

  if (!mapped) {
    reasons.push("This tank is a mixed community rather than a single biotope, which is a perfectly good way to keep fish.");
    fixes.push("For a biotope build, pick species that share one region.");
  } else {
    reasons.push(`Dominant biotope: ${dominantLabel}, ${Math.round(cohesion * 100)}% of stock.`);
    if (unmappedShare > 0) {
      reasons.push(`${Math.round(unmappedShare * 100)}% of the stock is from a region we have not mapped yet, so it cannot count towards authenticity.`);
    }
    if (cohesion < 1) fixes.push(`Remove species from other regions to strengthen the ${dominantLabel} theme.`);
    if (waterAuthenticity < 0.8) fixes.push(`Move target pH and temperature towards ${dominantLabel} ranges: ${water.ph_min}–${water.ph_max} pH, ${water.temp_min}–${water.temp_max} °C.`);
    if (hardscapeMatch < 0.7) fixes.push(`Swap hardscape for items from the ${dominantLabel} region.`);
    if (plantMatch < 0.7) fixes.push(`Swap plants for species from the ${dominantLabel} region.`);
  }

  const badge = mapped && cohesion === 1 && score >= 85 ? "true-biotope" : undefined;
  return { score, reasons, fixes, badge, dominantRegion: dominant };
}
