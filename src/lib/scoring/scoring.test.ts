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

  it("illegal species caps overall at 30", () => {
    const s = scoreTank(
      baseState({
        species: [
          { species: illegal, quantity: 1 },
          { species: tetra, quantity: 10 },
        ],
      }),
    );
    expect(s.legality.score).toBeLessThanOrEqual(40);
    expect(s.overall).not.toBeNull();
    expect(s.overall!).toBeLessThanOrEqual(30);
    expect(s.capReason?.toLowerCase()).toMatch(/legal|illegal|australia/);
  });

  it("60 corys overstock the tank and cap at 45", () => {
    const s = scoreTank(
      baseState({
        species: [{ species: cory, quantity: 60 }],
      }),
    );
    expect(s.bioload.loadPercent).toBeGreaterThan(110);
    expect(s.overall).not.toBeNull();
    expect(s.overall!).toBeLessThanOrEqual(45);
    expect(s.capReason?.toLowerCase()).toMatch(/overstock/);
  });

  it("3 tetras below school minimum dings compatibility but no cap", () => {
    const s = scoreTank(
      baseState({
        species: [{ species: tetra, quantity: 3 }],
      }),
    );
    expect(s.compatibility.score).toBeLessThan(100);
    expect(s.compatibility.reasons.some((r) => /school/i.test(r))).toBe(true);
    expect(s.overall).not.toBeNull();
    expect(typeof s.overall).toBe("number");
    expect(s.capReason).toBeNull();
  });

  it("native species surfaces nativeNotes without penalising legality", () => {
    const nativeFish = mkSpecies({
      id: "native",
      common_name: "Pacific Blue Eye",
      biotope_region: "australian_native",
      legal_status: "native",
      legal_note: "Australian native - check state permit rules.",
      native_ph_min: 6.5,
      native_ph_max: 8.0,
      native_temp_min_c: 20,
      native_temp_max_c: 28,
    });
    const s = scoreTank(
      baseState({
        target_ph: 7.2,
        target_temp_c: 24,
        species: [{ species: nativeFish, quantity: 6 }],
      }),
    );
    expect(s.legality.nativeNotes).toContain("Australian native - check state permit rules.");
    expect(s.legality.score).toBe(100);
    expect(s.legality.illegalSpecies).toEqual([]);
    expect(s.capReason).toBeNull();
  });


  it("prioritises prohibited livestock above every other problem", () => {
    const s = scoreTank(
      baseState({
        species: [
          { species: illegal, quantity: 1 },
          { species: oscar, quantity: 1 },
          { species: tetra, quantity: 3 },
        ],
      }),
    );
    expect(s.priorityAction?.severity).toBe("critical");
    expect(s.priorityAction?.category).toBe("legality");
    expect(s.priorityAction?.action).toMatch(/Banned Cichlid/);
  });

  it("prioritises predation when legality is clear", () => {
    const s = scoreTank(
      baseState({
        species: [
          { species: oscar, quantity: 1 },
          { species: tetra, quantity: 10 },
        ],
      }),
    );
    expect(s.priorityAction?.severity).toBe("critical");
    expect(s.priorityAction?.category).toBe("compatibility");
    expect(s.priorityAction?.title).toMatch(/predation/i);
  });

  it("returns no priority action for a strong setup", () => {
    const s = scoreTank(
      baseState({
        species: [
          { species: tetra, quantity: 12 },
          { species: cory, quantity: 6 },
        ],
      }),
    );
    expect(s.priorityAction).toBeNull();
  });

});
