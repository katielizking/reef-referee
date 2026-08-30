import { describe, expect, it } from "vitest";
import { adaptWaterToFirstSpecies } from "./defaults";
import type { Species, TankState } from "./types";

const fish = {
  id: "discus",
  common_name: "Discus",
  native_ph_min: 5.5,
  native_ph_max: 6.5,
  native_temp_min_c: 27,
  native_temp_max_c: 30,
} as Species;

const tank: Pick<TankState, "target_ph" | "target_temp_c" | "species"> = {
  target_ph: 7,
  target_temp_c: 25,
  species: [],
};

describe("first-species water defaults", () => {
  it("adapts untouched starter values to the middle of the first species range", () => {
    expect(adaptWaterToFirstSpecies(tank, fish)).toEqual({
      target_ph: 6,
      target_temp_c: 29,
    });
  });

  it("does not overwrite user-selected water", () => {
    expect(adaptWaterToFirstSpecies({ ...tank, target_ph: 7.4, target_temp_c: 24 }, fish)).toEqual({
      target_ph: 7.4,
      target_temp_c: 24,
    });
  });

  it("does not change water after livestock already exists", () => {
    expect(
      adaptWaterToFirstSpecies({ ...tank, species: [{ species: fish, quantity: 1 }] }, fish),
    ).toEqual({ target_ph: 7, target_temp_c: 25 });
  });
});
