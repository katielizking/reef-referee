import type { Filter, Species, TankState } from "./types";
import { litresOf } from "./scoring";

/**
 * Pick a reasonable default filter for a tank: the smallest filter whose
 * rated litres is at least the tank volume. Falls back to the largest
 * available filter if none matches, or null if the list is empty.
 */
export function pickDefaultFilter(
  filters: Filter[],
  state: Pick<TankState, "length_cm" | "width_cm" | "height_cm">,
): Filter | null {
  if (filters.length === 0) return null;
  const tankL = litresOf(state);
  if (tankL <= 0) return null;
  const sorted = [...filters].sort((a, b) => a.rated_litres - b.rated_litres);
  const match = sorted.find((f) => f.rated_litres >= tankL);
  return match ?? sorted[sorted.length - 1];
}

/**
 * Adapt untouched starter water settings to the first selected species. This
 * never overwrites a user's chosen values or an existing community.
 */
export function adaptWaterToFirstSpecies(
  state: Pick<TankState, "species" | "target_ph" | "target_temp_c">,
  species: Species,
): Pick<TankState, "target_ph" | "target_temp_c"> {
  const starterUntouched =
    state.species.length === 0 &&
    state.target_ph === 7 &&
    state.target_temp_c === 25;
  if (!starterUntouched) {
    return { target_ph: state.target_ph, target_temp_c: state.target_temp_c };
  }
  return {
    target_ph:
      Math.round(((species.native_ph_min + species.native_ph_max) / 2) * 10) /
      10,
    target_temp_c: Math.round(
      (species.native_temp_min_c + species.native_temp_max_c) / 2,
    ),
  };
}
