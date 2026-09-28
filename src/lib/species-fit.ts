import { litresOf, requiredSwimLengthCm, scoreTank, type Issue } from "./scoring";
import { scoringState } from "./tank-shape";
import { EXAMPLE_LABEL, unconfirmedGroups } from "./example-values";
import type { Species, SwimZone, TankState } from "./types";

/**
 * Everything the fish library and species pages say about whether a fish
 * suits a tank. The plan check runs the real scoring engine, so no rule is
 * restated here.
 */

// ---------- labels ----------

const HABITAT_LABEL: Record<string, string> = {
  flowing_stream: "flowing streams",
  still_blackwater: "still, tea-coloured blackwater",
  vegetated_margin: "densely planted shallows and margins",
  rocky_rift_lake: "rocky rift-lake shores",
  open_water: "open water",
};

/** A readable habitat, never the raw database value. */
export function habitatLabel(value: string): string {
  return HABITAT_LABEL[value] ?? value.replace(/_/g, " ");
}

export const SWIM_ZONE_LABEL: Record<SwimZone, string> = {
  top: "Near the surface",
  mid: "Mid-water",
  bottom: "Near the bottom",
};

// ---------- library filters ----------

export type GroupBand = "single" | "small" | "shoal";

export function groupBand(sp: Pick<Species, "min_group_size">): GroupBand {
  if (sp.min_group_size <= 1) return "single";
  return sp.min_group_size < 6 ? "small" : "shoal";
}

export const GROUP_BAND_LABEL: Record<GroupBand, string> = {
  single: "Can be kept singly",
  small: "Small group (2–5)",
  shoal: "Shoal of 6 or more",
};

export interface LibraryFilters {
  /** Tank volume in litres. Keeps fish whose minimum fits. */
  litres: number | null;
  /** Tank length in cm. Keeps fish whose swimming length fits. */
  lengthCm: number | null;
  /** Planned temperature in °C. Keeps fish whose range includes it. */
  tempC: number | null;
  /** Planned pH. Keeps fish whose range includes it. */
  ph: number | null;
  groups: GroupBand[];
  zones: SwimZone[];
}

export const NO_FILTERS: LibraryFilters = {
  litres: null,
  lengthCm: null,
  tempC: null,
  ph: null,
  groups: [],
  zones: [],
};

export function matchesFilters(sp: Species, f: LibraryFilters): boolean {
  if (f.litres !== null && sp.min_tank_litres > f.litres) return false;
  if (f.lengthCm !== null && requiredSwimLengthCm(sp) > f.lengthCm) return false;
  if (f.tempC !== null && (f.tempC < sp.native_temp_min_c || f.tempC > sp.native_temp_max_c))
    return false;
  if (f.ph !== null && (f.ph < sp.native_ph_min || f.ph > sp.native_ph_max)) return false;
  if (f.groups.length > 0 && !f.groups.includes(groupBand(sp))) return false;
  if (f.zones.length > 0 && !f.zones.includes(sp.swim_zone)) return false;
  return true;
}

// ---------- fit with the visitor's plan ----------

export type FitVerdict = "fits" | "caution" | "conflict" | "in-plan";

export interface PlanFit {
  verdict: FitVerdict;
  /** Why, in the scoring engine's own words. */
  reasons: string[];
  /** What the check cannot know. */
  limitations: string[];
}

const SEVERITY_ORDER: Issue["severity"][] = ["critical", "high", "medium", "low"];

function planIssues(state: TankState): Issue[] {
  const s = scoreTank(scoringState(state));
  return [...s.compatibility.issues, ...(s.space.issues ?? []), ...(s.water.issues ?? [])];
}

/** Issues present in `after` that were not already in `before`. */
export function newIssues(before: Issue[], after: Issue[]): Issue[] {
  const seen = new Map<string, number>();
  for (const issue of before) seen.set(issue.code, (seen.get(issue.code) ?? 0) + 1);
  return after.filter((issue) => {
    const left = seen.get(issue.code) ?? 0;
    if (left === 0) return true;
    seen.set(issue.code, left - 1);
    return false;
  });
}

/**
 * Would this fish, at its minimum group, suit the visitor's current plan?
 * Judged by scoring the plan with and without it.
 */
export function planFit(state: TankState, sp: Species): PlanFit {
  const limitations = [
    "Based on our catalogue care data and your planned tank, not your actual water or individual fish.",
  ];
  const examples = unconfirmedGroups(state);
  if (examples.length > 0) {
    limitations.push(
      `Your ${examples.map((g) => EXAMPLE_LABEL[g]).join(" and ")} ${examples.length > 1 ? "are" : "is"} still the calculator's example values.`,
    );
  }
  if (state.species.length === 0) {
    limitations.push("Your plan has no fish yet, so only tank size and water were checked.");
  }

  if (state.species.some((row) => row.species.id === sp.id)) {
    return { verdict: "in-plan", reasons: ["Already in your plan."], limitations };
  }

  const quantity = Math.max(1, sp.min_group_size);
  const added = newIssues(
    planIssues(state),
    planIssues({ ...state, species: [...state.species, { species: sp, quantity }] }),
  ).sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  const worst = added[0]?.severity;
  const verdict: FitVerdict =
    worst === "critical" || worst === "high" ? "conflict" : worst === "medium" ? "caution" : "fits";
  const reasons =
    added.length > 0
      ? [...new Set(added.map((i) => i.reason))].slice(0, 3)
      : [
          `No problems found with a ${Math.round(litresOf(scoringState(state)))} L tank at pH ${state.target_ph.toFixed(1)} and ${state.target_temp_c} °C${
            state.species.length > 0
              ? `, alongside ${state.species.map((r) => r.species.common_name).join(", ")}`
              : ""
          }.`,
        ];
  return { verdict, reasons, limitations };
}

export const FIT_LABEL: Record<FitVerdict, string> = {
  fits: "Suits your plan",
  caution: "Suits with care",
  conflict: "Conflicts with your plan",
  "in-plan": "In your plan",
};

// ---------- species-specific guidance ----------

export interface Conflict {
  title: string;
  detail: string;
}

const genus = (sp: Species) => sp.scientific_name.split(/\s+/)[0]?.toLowerCase() ?? "";

/** Up to three catalogue fish matching `keep`, never the fish itself or its own genus. */
function examples(sp: Species, catalogue: Species[], keep: (other: Species) => boolean): string[] {
  return catalogue
    .filter((o) => o.id !== sp.id && genus(o) !== genus(sp) && keep(o))
    .sort((a, b) => a.common_name.localeCompare(b.common_name))
    .slice(0, 3)
    .map((o) => o.common_name);
}

const list = (names: string[]) =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/**
 * The conflicts this particular fish is likely to run into, using the same
 * thresholds as the scoring engine and naming real catalogue examples.
 */
export function likelyConflicts(sp: Species, catalogue: Species[]): Conflict[] {
  const out: Conflict[] = [];
  const name = sp.common_name;

  // Its own kind
  if (!sp.is_schooling && sp.temperament === "aggressive") {
    out.push({
      title: `Other ${name}`,
      detail: `Keep one ${name}. Two or more in the same tank are likely to fight, causing serious injury or death.`,
    });
  } else if (!sp.is_schooling && sp.temperament === "semi-aggressive") {
    out.push({
      title: `Other ${name}`,
      detail: `${name} is territorial. Keep one, or a group of at least 4 so no single fish takes all the aggression.`,
    });
  } else if (sp.is_schooling && sp.temperament === "aggressive") {
    out.push({
      title: `Other ${name}`,
      detail: `Keep a single ${name} or a full group of at least ${sp.min_group_size}. Small groups of two or three concentrate aggression on one fish.`,
    });
  }
  if (sp.conspecific_notes) out.push({ title: "Same-species notes", detail: sp.conspecific_notes });

  // Fins
  if (sp.fin_nipper) {
    const targets = examples(sp, catalogue, (o) => o.long_finned);
    out.push({
      title: "Long-finned tank mates",
      detail: `${name} may nip long fins${targets.length ? `, so avoid fish such as ${list(targets)}` : ""}.${sp.is_schooling ? ` Nipping gets worse in groups smaller than ${sp.min_group_size}.` : ""}`,
    });
  }
  if (sp.long_finned) {
    const nippers = examples(sp, catalogue, (o) => o.fin_nipper);
    out.push({
      title: "Fin-nipping tank mates",
      detail: `${name}'s long fins are easy targets${nippers.length ? ` for fin-nippers such as ${list(nippers)}` : ""}.${sp.active ? "" : " It is a slow swimmer, so it cannot get away from them."}`,
    });
  }

  // Predation, with the engine's thresholds (4× swallows, 2.5× may hunt)
  if (sp.predatory) {
    const prey = examples(sp, catalogue, (o) => o.adult_size_cm * 4 <= sp.adult_size_cm);
    out.push({
      title: "Smaller fish",
      detail: `${name} eats fish that fit in its mouth. Fish under about ${Math.round(sp.adult_size_cm / 4)} cm as adults are likely to be eaten, and fish under about ${Math.round(sp.adult_size_cm / 2.5)} cm are at risk${prey.length ? `, for example ${list(prey)}` : ""}.`,
    });
  } else {
    const predators = examples(
      sp,
      catalogue,
      (o) => o.predatory && o.adult_size_cm >= sp.adult_size_cm * 2.5,
    );
    if (predators.length) {
      out.push({
        title: "Larger predators",
        detail: `At ${sp.adult_size_cm} cm, ${name} can be eaten by predatory fish such as ${list(predators)}.`,
      });
    }
  }

  // Temperament towards other species
  if (sp.temperament !== "peaceful") {
    out.push({
      title: "Peaceful community fish",
      detail:
        sp.temperament === "aggressive"
          ? `${name} is aggressive and can injure calm, slow tank mates. Choose robust companions, or keep it on its own.`
          : `${name} may chase or intimidate timid fish, especially near its chosen territory.`,
    });
  }

  return out;
}
