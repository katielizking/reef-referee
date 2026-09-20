/**
 * Substrate and equipment checks.
 *
 * These sit outside the welfare score. They are derived from what the user has
 * already told us: the fish in the plan, the planting, the target temperature
 * and the shape of the glass. Nothing here is stored per species, because the
 * species table carries no substrate field and guessing one per fish would be
 * inventing data.
 */
import type { TankState } from "./types";
import { SUBSTRATE_LABEL } from "./types";

export type SetupSeverity = "critical" | "caution" | "note";

export interface SetupIssue {
  code:
    | "bare_glass_bottom_dweller"
    | "coarse_gravel_bottom_dweller"
    | "no_heater"
    | "heater_not_needed"
    | "no_light_with_plants"
    | "co2_without_plants"
    | "co2_needs_testing"
    | "tall_tank_small_floor";
  severity: SetupSeverity;
  reason: string;
  fix: string;
}

const ORDER: Record<SetupSeverity, number> = { critical: 0, caution: 1, note: 2 };

/** Fish that spend their lives on the bottom and sift or root through it. */
function bottomDwellers(state: TankState) {
  return state.species.filter((row) => row.species.swim_zone === "bottom");
}

export function checkSetup(state: TankState): SetupIssue[] {
  const issues: SetupIssue[] = [];
  const substrate = state.substrate ?? "gravel";
  const diggers = bottomDwellers(state);
  const plantCount = state.plants.reduce((n, row) => n + row.quantity, 0);
  const wantsPlants = plantCount > 0 || state.plant_density !== "none";

  if (diggers.length > 0) {
    const names = diggers.map((row) => row.species.common_name).join(", ");
    if (substrate === "bare") {
      issues.push({
        code: "bare_glass_bottom_dweller",
        severity: "critical",
        reason: `${names} feed by sifting the bottom. Bare glass gives them nothing to sift and wears their barbels down.`,
        fix: "Add sand or fine gravel.",
      });
    } else if (substrate === "gravel") {
      issues.push({
        code: "coarse_gravel_bottom_dweller",
        severity: "caution",
        reason: `${names} dig through the bottom. Coarse gravel damages barbels over time.`,
        fix: "Switch to sand or fine gravel.",
      });
    }
  }

  if (state.has_heater === false && state.target_temp_c >= 22) {
    issues.push({
      code: "no_heater",
      severity: "critical",
      reason: `Holding ${state.target_temp_c} °C without a heater means the tank tracks the room, and the swings are what harm fish.`,
      fix: "Add a heater rated for this volume.",
    });
  }

  if (state.has_heater !== false && state.target_temp_c <= 20 && state.species.length > 0) {
    issues.push({
      code: "heater_not_needed",
      severity: "note",
      reason: `At ${state.target_temp_c} °C these fish are in coldwater range, so a heater may only be needed to stop winter drops.`,
      fix: "Keep the heater set low as a floor, not a target.",
    });
  }

  if (state.has_light === false && wantsPlants) {
    issues.push({
      code: "no_light_with_plants",
      severity: "caution",
      reason: "Live plants need light to survive. Without it they rot and foul the water.",
      fix: "Add a light, or plan the tank without live plants.",
    });
  }

  if (state.has_co2 && plantCount === 0) {
    issues.push({
      code: "co2_without_plants",
      severity: "caution",
      reason:
        "There are no plants to use the CO2, and CO2 in a tank without plants drops the pH and stresses fish.",
      fix: "Add plants, or turn the CO2 off.",
    });
  } else if (state.has_co2 && state.species.length > 0) {
    issues.push({
      code: "co2_needs_testing",
      severity: "note",
      reason:
        "CO2 lowers pH through the day, so the water is not the same at lights-on and lights-off.",
      fix: "Test pH morning and evening for the first fortnight, and run it on a timer with the light.",
    });
  }

  if (state.tank_shape === "column" && diggers.length > 0) {
    issues.push({
      code: "tall_tank_small_floor",
      severity: "caution",
      reason: "A column tank is tall with a small floor, and bottom dwellers only use the floor.",
      fix: "Choose a longer tank, or swap to fish that use the middle and top.",
    });
  }

  return issues.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}

export function substrateLabel(state: TankState): string {
  return SUBSTRATE_LABEL[state.substrate ?? "gravel"];
}
