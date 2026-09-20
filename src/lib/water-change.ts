import { combinedFiltration } from "./scoring";
import type { Scorecard } from "./scoring";
import type { TankState } from "./types";

/**
 * Derived, never stored. A starting point for water changes, worked out from
 * the beta waste-load screen, planting and the biological media actually in
 * use. It is not a prescription and it never feeds the welfare score.
 */
export interface WaterChangeGuidance {
  weeklyPercent: number;
  litres: number;
  sentence: string;
  frequencyNote: string | null;
}

const BASE: Record<Scorecard["bioload"]["loadBand"], number> = {
  low: 15,
  moderate: 20,
  high: 30,
  "very-high": 40,
};

export function waterChangeGuidance(
  state: TankState,
  scorecard: Scorecard,
): WaterChangeGuidance | null {
  const litres = Math.round((state.length_cm * state.width_cm * state.height_cm) / 1000);
  if (litres <= 0 || state.species.length === 0) return null;

  let pct = BASE[scorecard.bioload.loadBand];

  if (state.plant_density === "heavy") pct -= 5;
  else if (state.plant_density === "none") pct += 5;

  const filtration = combinedFiltration(state);
  if (!filtration.hasFilter) pct += 10;
  else if (filtration.biological_media_level === "substantial") pct -= 5;
  else if (filtration.biological_media_level === "minimal") pct += 5;

  const weeklyPercent = Math.min(50, Math.max(10, Math.round(pct / 5) * 5));
  const changeLitres = Math.round((litres * weeklyPercent) / 100);

  const frequencyNote =
    state.maintenance_frequency === "weekly"
      ? null
      : `You have planned ${state.maintenance_frequency} changes. With this stock list, weekly is the safer habit.`;

  return {
    weeklyPercent,
    litres: changeLitres,
    sentence:
      "Start here, then let your nitrate readings decide. If nitrate climbs week to week, change more or more often.",
    frequencyNote,
  };
}
