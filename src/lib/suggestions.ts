import { litresOf, scoreTank, type Issue } from "./scoring";
import type { Species, TankState } from "./types";

export interface Suggestion {
  species: Species;
  /** Plain sentence saying why this one fits. Never a quantity to buy beyond the group minimum. */
  reason: string;
  groupNote: string | null;
}

function worstNewSeverity(before: Issue[], after: Issue[]): Issue["severity"] | null {
  const seen = new Map<string, number>();
  for (const issue of before) seen.set(issue.code, (seen.get(issue.code) ?? 0) + 1);
  const order: Issue["severity"][] = ["critical", "high", "medium", "low"];
  let worst: Issue["severity"] | null = null;
  for (const issue of after) {
    const left = seen.get(issue.code) ?? 0;
    if (left > 0) {
      seen.set(issue.code, left - 1);
      continue;
    }
    if (worst === null || order.indexOf(issue.severity) < order.indexOf(worst)) worst = issue.severity;
  }
  return worst;
}

function allIssues(state: TankState): Issue[] {
  const s = scoreTank(state);
  return [
    ...s.compatibility.issues,
    ...(s.space.issues ?? []),
    ...(s.water.issues ?? []),
    ...(s.bioload.issues ?? []),
  ];
}

/**
 * Species that clear every compatibility, space and water check for the current plan.
 * Judged by running the same scoring engine on the plan with the candidate's minimum
 * group added, so no rule is duplicated here. Never suggests a quantity beyond the
 * group minimum the species needs, and never claims spare capacity.
 */
export function suggestCompatibleSpecies(
  state: TankState,
  catalogue: Species[],
  limit = 6,
): Suggestion[] {
  if (state.species.length === 0) return [];
  const litres = litresOf(state);
  const held = new Set(state.species.map((row) => row.species.id));
  const baseIssues = allIssues(state);
  const base = scoreTank(state);
  if (base.overall === null) return [];

  const results: Array<Suggestion & { score: number }> = [];

  for (const species of catalogue) {
    if (held.has(species.id)) continue;
    if (species.min_tank_litres > litres) continue;

    const quantity = Math.max(1, species.min_group_size);
    const next: TankState = {
      ...state,
      species: [...state.species, { species, quantity }],
    };
    const scored = scoreTank(next);
    if (scored.overall === null) continue;
    if (scored.overall < base.overall - 2) continue;

    const worst = worstNewSeverity(baseIssues, allIssues(next));
    if (worst === "critical" || worst === "high" || worst === "medium") continue;

    results.push({
      species,
      score: scored.overall,
      reason: `Suits ${Math.round(litres)} L, and pH ${state.target_ph} at ${state.target_temp_c} °C sits inside its range of pH ${species.native_ph_min}–${species.native_ph_max} and ${species.native_temp_min_c}–${species.native_temp_max_c} °C.`,
      groupNote:
        species.min_group_size > 1
          ? `Keep at least ${species.min_group_size} together.`
          : null,
    });
  }

  return results
    .sort((a, b) => b.score - a.score || a.species.common_name.localeCompare(b.species.common_name))
    .slice(0, limit)
    .map(({ species, reason, groupNote }) => ({ species, reason, groupNote }));
}
