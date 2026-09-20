/**
 * Tank shape handling.
 *
 * Dimensions are always the bounding box of the glass. A shape that does not
 * fill that box holds less water, so the fill fraction below is applied before
 * anything is scored. The fractions are geometry, not husbandry:
 *
 * - corner tanks are a quarter circle inside their box: pi / 4 ≈ 0.79
 * - bowfront glass bulges past the flat back, so the box over-reads slightly
 * - rectangle, cube and column fill their box
 *
 * Erring low is deliberate. A shape that reads bigger than it is would make
 * every stocking check more generous, which is the wrong way to be wrong.
 */
import type { TankShape, TankState } from "./types";

export const SHAPE_FILL: Record<TankShape, number> = {
  rectangle: 1,
  cube: 1,
  column: 1,
  bowfront: 0.95,
  corner: 0.79,
};

export function shapeFill(shape: TankShape | undefined): number {
  return SHAPE_FILL[shape ?? "rectangle"];
}

/** Litres of water the glass actually holds, before substrate and hardscape. */
export function waterLitres(
  state: Pick<TankState, "length_cm" | "width_cm" | "height_cm" | "tank_shape">,
): number {
  return (
    ((state.length_cm * state.width_cm * state.height_cm) / 1000) * shapeFill(state.tank_shape)
  );
}

/**
 * The state to score. The engine reads litres from length x width x height, so
 * a shape that holds less water is passed through with its width scaled down to
 * match. Scoring stays metric and untouched.
 */
export function scoringState<T extends TankState>(state: T): T {
  const fill = shapeFill(state.tank_shape);
  if (fill === 1) return state;
  return { ...state, width_cm: state.width_cm * fill };
}
