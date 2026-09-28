import { describe, expect, it } from "vitest";
import { scoreTank } from "@/lib/scoring";
import { confirmValues, isExample, unconfirmedGroups } from "@/lib/example-values";
import { DEFAULT_STATE, parseDraft } from "@/lib/tank-draft";
import type { Species, TankState } from "@/lib/types";
import { nextAction } from "@/lib/next-action";

const fish = (overrides: Partial<Species> = {}) =>
  ({
    id: "tetra",
    common_name: "Neon tetra",
    scientific_name: "Paracheirodon innesi",
    min_tank_litres: 40,
    adult_size_cm: 3,
    bioload_factor: 0.5,
    swim_zone: "mid",
    temperament: "peaceful",
    is_schooling: true,
    min_group_size: 6,
    fin_nipper: false,
    predatory: false,
    long_finned: false,
    active: true,
    native_ph_min: 5,
    native_ph_max: 7.5,
    native_temp_min_c: 20,
    native_temp_max_c: 26,
    biotope_region: "amazon_blackwater",
    native_habitat_type: "still_blackwater",
    ...overrides,
  }) as Species;

const withFish = (state: TankState, quantity = 8, sp = fish()): TankState => ({
  ...state,
  species: [{ species: sp, quantity }],
});
const confirmed = confirmValues(confirmValues(DEFAULT_STATE, "size"), "water");
const next = (state: TankState) => nextAction(scoreTank(state), state);

describe("example values", () => {
  it("starts a new plan with example size and water targets", () => {
    expect(unconfirmedGroups(DEFAULT_STATE)).toEqual(["size", "water"]);
  });

  it("confirms one group without touching the other", () => {
    const s = confirmValues(DEFAULT_STATE, "size");
    expect(isExample(s, "size")).toBe(false);
    expect(isExample(s, "water")).toBe(true);
  });

  it("treats drafts saved before example values existed as the user's own", () => {
    const { exampleValues: _omit, ...legacy } = DEFAULT_STATE;
    const draft = parseDraft(JSON.stringify({ version: 1, state: legacy }));
    expect(draft && unconfirmedGroups(draft.state)).toEqual([]);
  });

  it("keeps example flags on a new draft through a reload", () => {
    const draft = parseDraft(JSON.stringify({ version: 1, state: DEFAULT_STATE }));
    expect(draft && unconfirmedGroups(draft.state)).toEqual(["size", "water"]);
  });
});

describe("nextAction", () => {
  it("has nothing to say before fish are added", () => {
    expect(next(DEFAULT_STATE)).toBeNull();
  });

  it("asks to confirm example values before anything short of critical", () => {
    const action = next(withFish(DEFAULT_STATE, 2));
    expect(action?.tone).toBe("confirm");
    expect(action?.title).toBe("Confirm your tank size and water targets");
    expect(action?.section).toBe("tank");
  });

  it("puts a critical welfare problem ahead of example values", () => {
    const predator = fish({
      id: "oscar",
      common_name: "Oscar",
      predatory: true,
      adult_size_cm: 30,
    });
    const state = {
      ...DEFAULT_STATE,
      species: [
        { species: fish(), quantity: 8 },
        { species: predator, quantity: 1 },
      ],
    };
    expect(next(state)?.tone).toBe("critical");
  });

  it("falls back to the plan's own problem once values are confirmed", () => {
    const action = next(withFish(confirmed, 2));
    expect(action?.tone).not.toBe("confirm");
    expect(action?.title).toBeTruthy();
  });
});
