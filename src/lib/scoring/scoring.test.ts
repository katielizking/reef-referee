import { describe, it, expect } from "vitest";
import { scoreTank } from "./index";
import type { Species, TankState, Filter, BiotopeRegion } from "../types";

function mkSpecies(overrides: Partial<Species> & { id: string; common_name: string; biotope_region: BiotopeRegion }): Species {
  return {
    scientific_name: overrides.common_name,
    min_tank_litres: 60,
    adult_size_cm: 4,
    bioload_factor: 1,
    swim_zone: "mid",
    temperament: "peaceful",
    is_schooling: false,
    min_group_size: 1,
    fin_nipper: false,
    predatory: false,
    long_finned: false,
    active: false,
    native_ph_min: 5.5,
    native_ph_max: 7.0,
    native_temp_min_c: 24,
    native_temp_max_c: 28,
    native_habitat_type: "stream",

    legal_in_australia: true,
    legal_status: "permitted",
    legal_note: null,
    ...overrides,
  } as Species;
}


const tetra = mkSpecies({
  id: "tetra",
  common_name: "Neon Tetra",
  biotope_region: "amazon_blackwater",
  is_schooling: true,
  min_group_size: 6,
  bioload_factor: 0.5,
  adult_size_cm: 3,
  min_tank_litres: 40,
  native_ph_min: 5.0,
  native_ph_max: 6.5,
  native_temp_min_c: 24,
  native_temp_max_c: 27,
});

const cory = mkSpecies({
  id: "cory",
  common_name: "Bronze Cory",
  biotope_region: "amazon_blackwater",
  is_schooling: true,
  min_group_size: 5,
  bioload_factor: 1.2,
  adult_size_cm: 6,
  min_tank_litres: 60,
  native_ph_min: 5.5,
  native_ph_max: 7.0,
  native_temp_min_c: 24,
  native_temp_max_c: 28,
});

const mbuna = mkSpecies({
  id: "mbuna",
  common_name: "Yellow Lab Mbuna",
  biotope_region: "lake_malawi",
  temperament: "aggressive",
  bioload_factor: 2,
  adult_size_cm: 10,
  min_tank_litres: 150,
  native_ph_min: 7.8,
  native_ph_max: 8.6,
  native_temp_min_c: 24,
  native_temp_max_c: 28,
});

const oscar = mkSpecies({
  id: "oscar",
  common_name: "Oscar",
  biotope_region: "amazon_blackwater",
  temperament: "semi-aggressive",
  predatory: true,
  bioload_factor: 6,
  adult_size_cm: 30,
  min_tank_litres: 400,
  native_ph_min: 6.0,
  native_ph_max: 7.5,
  native_temp_min_c: 24,
  native_temp_max_c: 28,
});

const illegal = mkSpecies({
  id: "illegal",
  common_name: "Banned Cichlid",
  biotope_region: "amazon_blackwater",
  legal_in_australia: false,
  legal_status: "prohibited",
  legal_note: "Test prohibited species.",

  bioload_factor: 1,
  adult_size_cm: 8,
  min_tank_litres: 80,
});

const filter: Filter = {
  id: "f1",
  name: "Test Filter",
  rated_litres: 250,
  turnover_lph: 1000,
};

function baseState(overrides: Partial<TankState> = {}): TankState {
  return {
    name: "Test",
    length_cm: 100,
    width_cm: 40,
    height_cm: 50,
    filter,
    maintenance_frequency: "weekly",
    target_ph: 6.0,
    target_temp_c: 26,
    plant_density: "none",
    species: [],
    plants: [],
    hardscape: [],
    ...overrides,
  };
}

describe("scoreTank", () => {
  it("ideal Amazon community scores highly with true biotope", () => {
    const s = scoreTank(
      baseState({
        species: [
          { species: tetra, quantity: 12 },
          { species: cory, quantity: 6 },
        ],
      }),
    );
    expect(s.overall).not.toBeNull();
    expect(s.overall!).toBeGreaterThanOrEqual(85);
    expect(s.biome.badge).toBe("true-biotope");
    expect(s.compatibility.score).toBe(100);
    expect(s.capReason).toBeNull();
  });

  it("empty tank returns null overall", () => {
    const s = scoreTank(baseState());
    expect(s.overall).toBeNull();
  });

  it("Oscar with tetras trips predation cap", () => {
    const s = scoreTank(
      baseState({
        species: [
          { species: oscar, quantity: 1 },
          { species: tetra, quantity: 10 },
        ],
      }),
    );
    expect(s.compatibility.criticalConflicts.length).toBeGreaterThan(0);
    expect(s.overall).not.toBeNull();
    expect(s.overall!).toBeLessThanOrEqual(40);
    expect(s.capReason).not.toBeNull();
  });

  it("mixed Amazon + Malawi at pH 7.0 lowers biome and compatibility without cap", () => {
    const s = scoreTank(
      baseState({
        target_ph: 7.0,
        species: [
          { species: tetra, quantity: 10 },
          { species: mbuna, quantity: 5 },
        ],
      }),
    );
    expect(s.biome.score).toBeLessThan(75);
    expect(s.compatibility.score).toBeLessThan(90);
    expect(s.capReason).toBeNull();
  });

  it("regional catalogue data never changes the welfare score", () => {
    const standard = scoreTank(baseState({ species: [{ species: tetra, quantity: 10 }] }));
    const regional = scoreTank(
      baseState({ species: [{ species: illegal, quantity: 1 }, { species: tetra, quantity: 10 }] }),
    );
    expect(regional.legality.score).toBe(100);
    expect(regional.legality.illegalSpecies).toEqual([]);
    expect(regional.capReason).toBeNull();
    expect(standard.overall).not.toBeNull();
    expect(regional.overall).not.toBeNull();
  });

  it("overstocking is still capped for fish welfare", () => {
    const s = scoreTank(baseState({ species: [{ species: cory, quantity: 60 }] }));
    expect(s.bioload.loadPercent).toBeGreaterThan(110);
    expect(s.overall).not.toBeNull();
    expect(s.overall!).toBeLessThanOrEqual(45);
  });

  it("predation remains the first priority action", () => {
    const s = scoreTank(
      baseState({ species: [{ species: oscar, quantity: 1 }, { species: tetra, quantity: 10 }] }),
    );
    expect(s.compatibility.criticalConflicts.length).toBeGreaterThan(0);
    expect(s.priorityAction?.category).toBe("compatibility");
  });

});
