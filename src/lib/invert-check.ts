/**
 * Invertebrate checks.
 *
 * Shrimp, snails, crayfish and crabs sit outside the welfare score on purpose.
 * The score is built and tested against fish data, and the capacity model has
 * never been calibrated for invertebrates. These checks are reported on their
 * own, in plain language, and never change the overall score.
 */
import type { Invertebrate, Species, TankState } from "./types";

export type InvertSeverity = "critical" | "caution" | "note";

export interface InvertIssue {
  code:
    | "tank_too_small"
    | "group_too_small"
    | "ph_outside_range"
    | "temp_outside_range"
    | "eaten_by_fish"
    | "hunts_tank_mates"
    | "needs_land";
  severity: InvertSeverity;
  subject: string;
  reason: string;
  fix: string;
}

const SEVERITY_ORDER: Record<InvertSeverity, number> = {
  critical: 0,
  caution: 1,
  note: 2,
};

export function litresOf(state: Pick<TankState, "length_cm" | "width_cm" | "height_cm">): number {
  return (state.length_cm * state.width_cm * state.height_cm) / 1000;
}

/** Fish big enough, or predatory enough, to treat a small invertebrate as food. */
function threatToInvert(fish: Species, invert: Invertebrate): boolean {
  if (invert.adult_size_cm > 6) return false;
  if (fish.predatory) return true;
  return fish.adult_size_cm >= invert.adult_size_cm * 2.5;
}

export function checkInvertebrates(state: TankState): InvertIssue[] {
  const rows = state.invertebrates ?? [];
  if (rows.length === 0) return [];

  const litres = litresOf(state);
  const issues: InvertIssue[] = [];

  for (const { invertebrate: inv, quantity } of rows) {
    const name = inv.common_name;

    if (litres < inv.min_tank_litres) {
      issues.push({
        code: "tank_too_small",
        severity: "critical",
        subject: name,
        reason: `${name} needs at least ${Math.round(inv.min_tank_litres)} L. This tank holds ${Math.round(litres)} L.`,
        fix: "Choose a bigger tank or leave this one out.",
      });
    }

    if (quantity < inv.min_group_size) {
      issues.push({
        code: "group_too_small",
        severity: "caution",
        subject: name,
        reason: `${name} does best in groups of ${inv.min_group_size} or more. You have ${quantity}.`,
        fix: `Raise the group to at least ${inv.min_group_size}.`,
      });
    }

    if (state.target_ph < inv.native_ph_min || state.target_ph > inv.native_ph_max) {
      issues.push({
        code: "ph_outside_range",
        severity: "caution",
        subject: name,
        reason: `Your planned pH of ${state.target_ph} sits outside the ${inv.native_ph_min} to ${inv.native_ph_max} range recorded for ${name}.`,
        fix: "Match your water to this species, or pick one that suits your water.",
      });
    }

    if (
      state.target_temp_c < inv.native_temp_min_c ||
      state.target_temp_c > inv.native_temp_max_c
    ) {
      issues.push({
        code: "temp_outside_range",
        severity: "caution",
        subject: name,
        reason: `Your planned ${state.target_temp_c} °C sits outside the ${inv.native_temp_min_c} to ${inv.native_temp_max_c} °C range recorded for ${name}.`,
        fix: "Change the temperature, or pick a species suited to it.",
      });
    }

    const hunters = state.species.filter((row) => threatToInvert(row.species, inv));
    if (hunters.length > 0) {
      issues.push({
        code: "eaten_by_fish",
        severity: "critical",
        subject: name,
        reason:
          inv.fish_risk_note ??
          `${hunters[0].species.common_name} is big enough to eat ${name}.`,
        fix: `Drop ${name}, or drop the fish that will hunt it.`,
      });
    }

    if (inv.predatory) {
      const smallFish = state.species.filter(
        (row) => row.species.adult_size_cm <= inv.adult_size_cm,
      );
      const otherInverts = rows.filter((row) => row.invertebrate.id !== inv.id);
      if (smallFish.length > 0 || otherInverts.length > 0) {
        issues.push({
          code: "hunts_tank_mates",
          severity: "critical",
          subject: name,
          reason:
            inv.fish_risk_note ?? `${name} hunts smaller tank mates, usually at night.`,
          fix: `Keep ${name} on its own, or remove the tank mates it can catch.`,
        });
      }
    }

    if (inv.care_notes && /land access|semi-terrestrial/i.test(inv.care_notes)) {
      issues.push({
        code: "needs_land",
        severity: "note",
        subject: name,
        reason: `${name} needs dry land to climb out onto, not a full tank of water.`,
        fix: "Plan a setup with a land area and a secure lid.",
      });
    }
  }

  return issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/** Total invertebrate bioload, reported beside the score, never inside it. */
export function invertebrateBioload(state: TankState): number {
  return (state.invertebrates ?? []).reduce(
    (sum, row) => sum + row.invertebrate.bioload_factor * row.quantity,
    0,
  );
}
