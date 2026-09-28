import type { TankState } from "./types";

/**
 * A new plan starts from example values (a 90 × 40 × 45 cm tank, pH 7.0 and
 * 25 °C) so the calculator has something to work with. They are not the
 * user's tank, so the UI marks them as examples until they are confirmed or
 * edited. Missing flags mean confirmed: saved tanks, loaded tanks and drafts
 * from before this existed are the user's own values.
 */
export type ExampleGroup = "size" | "water";

export const EXAMPLE_LABEL: Record<ExampleGroup, string> = {
  size: "tank size",
  water: "water targets",
};

export function isExample(state: TankState, group: ExampleGroup): boolean {
  return state.exampleValues?.[group] === true;
}

export function confirmValues(state: TankState, group: ExampleGroup): TankState {
  if (!isExample(state, group)) return state;
  return { ...state, exampleValues: { ...state.exampleValues, [group]: false } };
}

export function unconfirmedGroups(state: TankState): ExampleGroup[] {
  return (["size", "water"] as const).filter((group) => isExample(state, group));
}
