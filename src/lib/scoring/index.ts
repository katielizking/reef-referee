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
  | "temp-unsuitable"
  | "no-filter"
  | "no-biological-media"
  | "filter-not-mature"
  | "cycle-not-started"
  | "cycle-in-progress"
  | "cycle-unverified"
  | "water-test-stale"
  | "ammonia-detected"
  | "nitrite-detected";

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
  category: "readiness" | "compatibility" | "bioload" | "space" | "water" | "biome";
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
  category: "readiness" | "compatibility" | "bioload" | "space" | "water" | "biome";
  title: string;
  action: string;
}

export interface Scorecard {
  overall: number | null;
  capReason: string | null;
  priorityAction: PriorityAction | null;
  readiness: SubScore & {
    status: "ready" | "unverified" | "cycling" | "unsafe";
    issues: Issue[];
  };
  compatibility: CompatibilitySubScore;
  /** Experimental and informational only. The inherited proxy is not a
   * validated biological-capacity model and never changes the welfare score. */
  bioload: SubScore & {
    loadPercent: number;
    loadBand: "low" | "moderate" | "high" | "very-high";
    experimental: true;
  };
  space: SubScore;
  water: SubScore & { misfits: string[] };
  /** Informational only. Biotope authenticity is a style goal, not a welfare measure,
   *  so it is reported beside the score and never folded into it. */
  biome: SubScore & { badge?: "true-biotope"; dominantRegion?: BiotopeRegion };
}

/** Welfare weights. Biotope and the experimental waste-load screen are
 * deliberately absent from the headline result. */
export const WEIGHTS = {
  compatibility: 0.45,
  space: 0.35,
  water: 0.2,
} as const;

/** Experimental screen values below this point receive no additional warning. */
export const BIOLOAD_PLATEAU = 85;
/** Score lost per percentage point of load above the plateau. */
export const BIOLOAD_DECAY = 2.2;

export function litresOf(state: Pick<TankState, "length_cm" | "width_cm" | "height_cm">) {
  return (state.length_cm * state.width_cm * state.height_cm) / 1000;
}

export function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Operational freshness window for readiness evidence. This is deliberately a
 * product safety rule, not a claim that one test predicts the next seven days.
 */
export const WATER_TEST_MAX_AGE_DAYS = 7;

export function waterTestAgeDays(testedOn: string | null, now = new Date()): number | null {
  if (!testedOn || !/^\d{4}-\d{2}-\d{2}$/.test(testedOn)) return null;
  const [year, month, day] = testedOn.split("-").map(Number);
  const testDay = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (!Number.isFinite(testDay)) return null;
  return Math.floor((today - testDay) / 86_400_000);
}

export function isWaterTestCurrent(testedOn: string | null, now = new Date()): boolean {
  const age = waterTestAgeDays(testedOn, now);
  // A one-day future tolerance prevents an Australian-local date entered just
  // after midnight from being rejected while the UTC date is still yesterday.
  return age !== null && age >= -1 && age <= WATER_TEST_MAX_AGE_DAYS;
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
  const readiness = scoreReadiness(state);
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
      readiness,
      compatibility,
      bioload,
      space,
      water,
      biome,
    };
  }

  const weighted = Math.round(
    compatibility.score * WEIGHTS.compatibility +
      space.score * WEIGHTS.space +
      water.score * WEIGHTS.water,
  );

  const caps: Array<{ cap: number; reason: string }> = [];
  if (compatibility.criticalConflicts.length > 0) {
    caps.push({
      cap: 40,
      reason: "Score capped: a critical compatibility conflict will cost fish their lives.",
    });
  }
  if (readiness.status === "unsafe") {
    caps.push({
      cap: 25,
      reason: "Score capped: ammonia or nitrite is detectable. Do not add fish.",
    });
  } else if (readiness.status === "cycling") {
    caps.push({
      cap: 35,
      reason: "Score capped: the aquarium or filter is still cycling.",
    });
  } else if (readiness.status === "unverified") {
    caps.push({
      cap: 60,
      reason:
        "Score capped: biological filtration has not been verified with current test results.",
    });
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
    priorityAction: choosePriorityAction({
      readiness,
      compatibility,
      bioload,
      space,
      water,
      biome,
    }),
    readiness,
    compatibility,
    bioload,
    space,
    water,
    biome,
  };
}

function choosePriorityAction(
  scores: Pick<Scorecard, "readiness" | "compatibility" | "bioload" | "space" | "water" | "biome">,
): PriorityAction | null {
  if (scores.readiness.status === "unsafe") {
    const issue = scores.readiness.issues[0];
    return {
      severity: "critical",
      category: "readiness",
      title: "Do not add fish to this water",
      action: issue?.fix ?? "Resolve detectable ammonia or nitrite and retest before stocking.",
    };
  }
  const critical = scores.compatibility.issues.find((i) => i.severity === "critical");
  if (critical) {
    return {
      severity: "critical",
      category: "compatibility",
      title: "Fix this before you buy anything",
      action: critical.fix,
    };
  }
  if (scores.readiness.status !== "ready") {
    const issue = scores.readiness.issues[0];
    return {
      severity: "critical",
      category: "readiness",
      title:
        scores.readiness.status === "cycling"
          ? "Finish cycling before stocking"
          : "Verify the nitrogen cycle first",
      action:
        issue?.fix ?? "Confirm an established biofilter with current ammonia and nitrite results.",
    };
  }
  if (scores.water.score < 70 && scores.water.fixes.length > 0) {
    return {
      severity: "high",
      category: "water",
      title: "Your water settings do not suit these fish",
      action: scores.water.fixes[0],
    };
  }
  if (scores.space.score < 60 && scores.space.fixes.length > 0) {
    return {
      severity: "high",
      category: "space",
      title: "Fix the swimming-space problem first",
      action: scores.space.fixes[0],
    };
  }
  const high = scores.compatibility.issues.find((i) => i.severity === "high");
  if (high) {
    return {
      severity: "high",
      category: "compatibility",
      title: "Improve compatibility first",
      action: high.fix,
    };
  }
  if (scores.bioload.loadBand === "very-high" && scores.bioload.fixes.length > 0) {
    return {
      severity: "medium",
      category: "bioload",
      title: "Review the stocking demand",
      action: scores.bioload.fixes[0],
    };
  }
  return null;
}

// ============== 1. COMPATIBILITY ==============

const AGGRESSION: Record<string, number> = {
  peaceful: 0,
  "semi-aggressive": 1,
  aggressive: 2,
};

function scoreCompatibility(state: TankState): CompatibilitySubScore {
  if (state.species.length === 0) return { ...empty, criticalConflicts: [], issues: [] };

  const issues: Issue[] = [];
  const criticalConflicts: string[] = [];
  const add = (
    code: IssueCode,
    severity: Issue["severity"],
    weight: number,
    reason: string,
    fix: string,
  ) =>
    issues.push({
      code,
      severity,
      category: "compatibility",
      weight,
      reason,
      fix,
    });

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
    if (
      sp.is_schooling &&
      sp.temperament === "aggressive" &&
      quantity > 1 &&
      quantity < sp.min_group_size
    ) {
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
    if (
      sp.is_schooling &&
      sp.temperament === "aggressive" &&
      quantity >= sp.min_group_size &&
      quantity > 1
    ) {
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
      const eats = (p: typeof a, prey: typeof a) =>
        p.predatory && prey.adult_size_cm * 2.5 <= p.adult_size_cm;
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
      const phOverlap =
        Math.min(a.native_ph_max, b.native_ph_max) - Math.max(a.native_ph_min, b.native_ph_min);
      if (phOverlap < 0) {
        add(
          "ph-no-overlap",
          "high",
          20,
          `${a.common_name} and ${b.common_name} need different water chemistry, with no shared pH at all.`,
          `Pick species with overlapping pH ranges.`,
        );
      } else if (phOverlap < 0.5) {
        add(
          "ph-marginal",
          "medium",
          9,
          `${a.common_name} and ${b.common_name} only just overlap on pH.`,
          `Aim for species with at least half a pH point in common.`,
        );
      }

      const tOverlap =
        Math.min(a.native_temp_max_c, b.native_temp_max_c) -
        Math.max(a.native_temp_min_c, b.native_temp_min_c);
      if (tOverlap < 0) {
        add(
          "temp-no-overlap",
          "high",
          20,
          `${a.common_name} and ${b.common_name} need different temperatures, with no shared range at all.`,
          `Pick species with overlapping temperature ranges.`,
        );
      } else if (tOverlap < 2) {
        add(
          "temp-marginal",
          "medium",
          9,
          `${a.common_name} and ${b.common_name} share only ${tOverlap.toFixed(1)} °C of comfortable range.`,
          `Aim for at least 2 °C of overlap so the tank has somewhere safe to sit.`,
        );
      }
    }
  }

  const score = aggregate(issues);
  const reasons = issues.length
    ? issues.map((i) => i.reason)
    : ["No compatibility risks are currently flagged by the catalogue rules."];
  const fixes = issues.map((i) => i.fix);
  return { score, reasons, fixes, criticalConflicts, issues };
}

// ============== 2. CYCLE & BIOFILTER READINESS ==============

function scoreReadiness(state: TankState): Scorecard["readiness"] {
  const issues: Issue[] = [];
  const add = (
    code: IssueCode,
    severity: Issue["severity"],
    weight: number,
    reason: string,
    fix: string,
  ) => issues.push({ code, severity, category: "readiness", weight, reason, fix });

  if (state.ammonia_mg_l !== null && state.ammonia_mg_l > 0) {
    add(
      "ammonia-detected",
      "critical",
      90,
      `Ammonia is detectable at ${state.ammonia_mg_l} mg/L.`,
      "Do not add fish. Identify the source, protect any livestock already present and retest until ammonia remains at 0 mg/L.",
    );
  }
  if (state.nitrite_mg_l !== null && state.nitrite_mg_l > 0) {
    add(
      "nitrite-detected",
      "critical",
      90,
      `Nitrite is detectable at ${state.nitrite_mg_l} mg/L.`,
      "Do not add fish. Continue cycling or correct the biofilter problem and retest until nitrite remains at 0 mg/L.",
    );
  }

  if (!state.filter) {
    add(
      "no-filter",
      "critical",
      55,
      "No filter is selected, so biological filtration cannot be assessed.",
      "Choose a filter and establish its biological media before stocking.",
    );
  }
  if (state.biological_media_level === "minimal") {
    add(
      "no-biological-media",
      "high",
      35,
      "The selected setup has minimal biological media.",
      "Add suitable biological media and allow its microbial community to establish before stocking.",
    );
  }
  if (state.filter_maturity === "new" || state.filter_maturity === "maturing") {
    add(
      "filter-not-mature",
      "critical",
      55,
      state.filter_maturity === "new"
        ? "The filter media is new and does not yet have an established biofilter."
        : "The filter media is still maturing.",
      "Keep cycling and use water tests—not elapsed time alone—to decide when the biofilter is ready.",
    );
  } else if (state.filter_maturity === "unknown") {
    add(
      "filter-not-mature",
      "high",
      30,
      "The maturity of the biological filter has not been recorded.",
      "Confirm whether the media is established. Seeded media can help, but current water tests still need to verify the cycle.",
    );
  }

  if (state.cycle_status === "not_started") {
    add(
      "cycle-not-started",
      "critical",
      70,
      "The nitrogen cycle has not been started.",
      "Cycle the aquarium before adding fish, then verify the result with ammonia and nitrite tests.",
    );
  } else if (state.cycle_status === "cycling") {
    add(
      "cycle-in-progress",
      "critical",
      65,
      "The aquarium is still cycling.",
      "Wait until the cycle is complete and current tests show 0 mg/L ammonia and 0 mg/L nitrite before stocking.",
    );
  }

  const hasZeroResults = state.ammonia_mg_l === 0 && state.nitrite_mg_l === 0;
  const testAgeDays = waterTestAgeDays(state.water_tested_on);
  const hasCurrentEvidence = hasZeroResults && isWaterTestCurrent(state.water_tested_on);
  if (
    state.cycle_status === "unknown" ||
    (state.cycle_status === "verified" && !hasCurrentEvidence)
  ) {
    const staleDatedResults =
      state.cycle_status === "verified" &&
      hasZeroResults &&
      state.water_tested_on !== null &&
      !hasCurrentEvidence;
    const staleReason =
      testAgeDays !== null && testAgeDays < -1
        ? "The recorded water-test date is in the future."
        : `The recorded zero-ammonia and zero-nitrite results are ${testAgeDays ?? "more than seven"} days old.`;
    add(
      staleDatedResults ? "water-test-stale" : "cycle-unverified",
      "critical",
      50,
      staleDatedResults
        ? staleReason
        : state.cycle_status === "verified"
          ? "The cycle is marked verified, but current zero-ammonia and zero-nitrite results are missing."
          : "The nitrogen-cycle status has not been verified.",
      `Retest and record ammonia at 0 mg/L and nitrite at 0 mg/L within the last ${WATER_TEST_MAX_AGE_DAYS} days, then mark the cycle verified.`,
    );
  }

  let status: Scorecard["readiness"]["status"] = "ready";
  if (
    issues.some((issue) => issue.code === "ammonia-detected" || issue.code === "nitrite-detected")
  ) {
    status = "unsafe";
  } else if (
    state.cycle_status === "not_started" ||
    state.cycle_status === "cycling" ||
    state.filter_maturity === "new" ||
    state.filter_maturity === "maturing"
  ) {
    status = "cycling";
  } else if (issues.length > 0) {
    status = "unverified";
  }

  const reasons = issues.length
    ? issues.map((issue) => issue.reason)
    : [
        `An established biological filter and zero-ammonia/zero-nitrite results from the last ${WATER_TEST_MAX_AGE_DAYS} days are recorded.`,
      ];
  return {
    status,
    score: aggregate(issues),
    reasons,
    fixes: issues.map((issue) => issue.fix),
    issues,
  };
}

// ============== 3. EXPERIMENTAL WASTE-LOAD SCREEN ==============

function scoreBioload(state: TankState): Scorecard["bioload"] {
  const litres = litresOf(state);
  if (litres === 0) {
    return {
      score: 0,
      reasons: ["Set your tank dimensions first."],
      fixes: [],
      loadPercent: 0,
      loadBand: "low",
      experimental: true,
    };
  }

  // This inherited litres/5 reference has not been scientifically calibrated.
  // It is deliberately isolated as a beta screening index: filter turnover,
  // planting and maintenance no longer inflate a fictional biological capacity,
  // and the result never contributes to the headline welfare score.
  const legacyReference = litres / 5;
  const load = state.species.reduce((s, x) => s + x.species.bioload_factor * x.quantity, 0);
  const loadPercent = legacyReference > 0 ? Math.round((load / legacyReference) * 100) : 0;
  const loadBand: Scorecard["bioload"]["loadBand"] =
    loadPercent > 110
      ? "very-high"
      : loadPercent > 75
        ? "high"
        : loadPercent > 45
          ? "moderate"
          : "low";

  // Monotonic by design. This internal beta indicator can only hold steady or
  // decline as estimated waste demand is added; it never rewards adding fish.
  const score = Math.round(
    loadPercent <= BIOLOAD_PLATEAU
      ? 100
      : clamp(100 - (loadPercent - BIOLOAD_PLATEAU) * BIOLOAD_DECAY),
  );

  const reasons: string[] = [];
  const fixes: string[] = [];

  if (state.species.length === 0) {
    reasons.push("No fish added yet.");
  } else {
    reasons.push(`The preliminary waste-load screen is ${loadBand.replace("-", " ")}.`);
    fixes.push(
      "Use this as a review flag only. Do not use it to decide how many more fish to add; confirm species needs, biofilter maturity and water-test trends.",
    );
  }

  return { score, reasons, fixes, loadPercent, loadBand, experimental: true };
}

// ============== 4. SPACE ==============

function scoreSpace(state: TankState): SubScore {
  if (state.species.length === 0) return { ...empty };
  const litres = litresOf(state);
  const length = state.length_cm;
  const issues: Issue[] = [];
  const add = (
    code: IssueCode,
    severity: Issue["severity"],
    weight: number,
    reason: string,
    fix: string,
  ) => issues.push({ code, severity, category: "space", weight, reason, fix });

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
      add(
        "footprint-crowded",
        "medium",
        10,
        `${quantity} × ${sp.common_name} at that adult size crowds this footprint.`,
        `Reduce the group, or increase the tank footprint.`,
      );
    }
  }

  const score = aggregate(issues);
  const reasons = issues.length
    ? issues.map((i) => i.reason)
    : ["No space issues are currently flagged against the catalogue minima."];
  return { score, reasons, fixes: issues.map((i) => i.fix), issues };
}

// ============== 5. WATER ==============

/**
 * Does the tank the user is actually planning suit the fish they are actually
 * adding? Nothing asked this before: pH and temperature only ever mattered
 * between two species, never between a species and its tank.
 */
function scoreWater(state: TankState): SubScore & { misfits: string[] } {
  if (state.species.length === 0) return { ...empty, misfits: [] };

  const issues: Issue[] = [];
  const misfits: string[] = [];
  const add = (
    code: IssueCode,
    severity: Issue["severity"],
    weight: number,
    reason: string,
    fix: string,
  ) => issues.push({ code, severity, category: "water", weight, reason, fix });

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
  const reasons = issues.length
    ? issues.map((i) => i.reason)
    : ["The selected settings fall within every recorded care range."];
  return { score, reasons, fixes: issues.map((i) => i.fix), misfits, issues };
}

// ============== 5. BIOME (informational) ==============

function scoreBiome(
  state: TankState,
): SubScore & { badge?: "true-biotope"; dominantRegion?: BiotopeRegion } {
  if (state.species.length === 0) {
    return {
      ...empty,
      score: 0,
      reasons: ["Add some fish to score biotope replication."],
    };
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
      : Math.max(
          0,
          1 -
            Math.min(
              Math.abs(state.target_ph - water.ph_min),
              Math.abs(state.target_ph - water.ph_max),
            ) /
              2,
        );
  const tempFit =
    state.target_temp_c >= water.temp_min && state.target_temp_c <= water.temp_max
      ? 1
      : Math.max(
          0,
          1 -
            Math.min(
              Math.abs(state.target_temp_c - water.temp_min),
              Math.abs(state.target_temp_c - water.temp_max),
            ) /
              4,
        );
  const waterAuthenticity = mapped ? (phFit + tempFit) / 2 : 0;

  const hardscapeMatch =
    !mapped || state.hardscape.length === 0
      ? 0.5
      : state.hardscape.filter((h) => h.hardscape.biotope_region === dominant).length /
        state.hardscape.length;
  const plantMatch =
    !mapped || state.plants.length === 0
      ? 0.5
      : state.plants.filter((p) => p.plant.biotope_region === dominant).length /
        state.plants.length;

  const raw = cohesion * 45 + waterAuthenticity * 25 + hardscapeMatch * 15 + plantMatch * 15;
  const score = Math.round(clamp(raw));

  const reasons: string[] = [];
  const fixes: string[] = [];
  const dominantLabel = BIOTOPE_LABEL[dominant];

  if (!mapped) {
    reasons.push(
      "This tank is a mixed community rather than a single biotope, which is a perfectly good way to keep fish.",
    );
    fixes.push("For a biotope build, pick species that share one region.");
  } else {
    reasons.push(`Dominant biotope: ${dominantLabel}, ${Math.round(cohesion * 100)}% of stock.`);
    if (unmappedShare > 0) {
      reasons.push(
        `${Math.round(unmappedShare * 100)}% of the stock is from a region we have not mapped yet, so it cannot count towards authenticity.`,
      );
    }
    if (cohesion < 1)
      fixes.push(`Remove species from other regions to strengthen the ${dominantLabel} theme.`);
    if (waterAuthenticity < 0.8)
      fixes.push(
        `Move target pH and temperature towards ${dominantLabel} ranges: ${water.ph_min}–${water.ph_max} pH, ${water.temp_min}–${water.temp_max} °C.`,
      );
    if (hardscapeMatch < 0.7)
      fixes.push(`Swap hardscape for items from the ${dominantLabel} region.`);
    if (plantMatch < 0.7) fixes.push(`Swap plants for species from the ${dominantLabel} region.`);
  }

  const badge = mapped && cohesion === 1 && score >= 85 ? "true-biotope" : undefined;
  return { score, reasons, fixes, badge, dominantRegion: dominant };
}
