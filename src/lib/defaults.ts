import type { Filter, TankState } from "./types";
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
