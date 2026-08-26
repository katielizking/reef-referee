import { describe, expect, it } from "vitest";
import { BIOLOAD_PLATEAU, GROUP_CODES, WEIGHTS, scoreTank, type Scorecard } from "./index";
import type { Filter, Species, TankState } from "../types";

/**
 * These tests exist to stop the scoring engine drifting back into advice that
 * would kill fish. Every case below is a real failure the engine once had.
 * If you change a weight or a rule and one of these breaks, the test is
 * probably right and the change is probably wrong.
 */

const species = (over: Partial<Species> & Pick<Species, "common_name">): Species => ({
  id: over.common_name.toLowerCase().replace(/\W+/g, "-"),
  scientific_name: "Testus fishus",
  min_tank_litres: 60,
  adult_size_cm: 5,
  bioload_factor: 1,
  swim_zone: "mid",
  temperament: "peaceful",
  is_schooling: false,
  min_group_size: 1,
  fin_nipper: false,
  predatory: false,
  long_finned: false,
  active: true,
  native_ph_min: 6.5,
  native_ph_max: 7.5,
  native_temp_min_c: 23,
  native_temp_max_c: 27,
  biotope_region: "amazon_blackwater",
  native_habitat_type: "still_blackwater",
  legal_status: "permitted",
  legal_note: null,
  ...over,
});

const TETRA = species({ common_name: "Test tetra", is_schooling: true, min_group_size: 8, bioload_factor: 0.9 });
const BETTA = species({ common_name: "Test betta", temperament: "aggressive", long_finned: true, fin_nipper: true, min_tank_litres: 20 });
const MBUNA_A = species({ common_name: "Test mbuna A", temperament: "aggressive", is_schooling: true, min_group_size: 4, biotope_region: "lake_malawi", native_ph_min: 7.6, native_ph_max: 8.6, min_tank_litres: 200, bioload_factor: 3 });
const MBUNA_B = species({ common_name: "Test mbuna B", temperament: "aggressive", is_schooling: true, min_group_size: 4, biotope_region: "lake_malawi", native_ph_min: 7.6, native_ph_max: 8.6, min_tank_litres: 200, bioload_factor: 3 });
const PREDATOR = species({ common_name: "Test predator", predatory: true, adult_size_cm: 30, min_tank_litres: 200, bioload_factor: 6 });
const COLD = species({ common_name: "Test coldwater", native_temp_min_c: 16, native_temp_max_c: 22 });

const FILTER: Filter = { id: "f", name: "Test canister", rated_litres: 330, turnover_lph: 1150 };

const tank = (
  stock: Array<{ species: Species; quantity: number }>,
  over: Partial<TankState> = {},
): TankState => ({
  name: "Test tank",
  length_cm: 130,
  width_cm: 50,
  height_cm: 38.5,
  filter: FILTER,
  maintenance_frequency: "weekly",
  target_ph: 7.0,
  target_temp_c: 25,
  plant_density: "none",
  species: stock,
  plants: [],
  hardscape: [],
  ...over,
});

const bioloadAt = (loadPercent: number) =>
  Math.round(loadPercent <= BIOLOAD_PLATEAU ? 100 : Math.max(0, 100 - (loadPercent - BIOLOAD_PLATEAU) * 2.2));

describe("weighting", () => {
  it("does not fold biotope replication into the welfare score", () => {
    expect(Object.keys(WEIGHTS)).toEqual(["compatibility", "bioload", "space", "water"]);
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
  });
});

describe("bioload", () => {
  it("never rewards a fuller tank", () => {
    for (let lp = 1; lp <= 200; lp++) {
      expect(bioloadAt(lp)).toBeLessThanOrEqual(bioloadAt(lp - 1));
    }
  });

  it("has no discontinuity anywhere on the curve", () => {
    for (let lp = 1; lp <= 200; lp++) {
      expect(bioloadAt(lp - 1) - bioloadAt(lp)).toBeLessThanOrEqual(3);
    }
  });

  it("treats an understocked tank as fine, not as a fault", () => {
    const light = scoreTank(tank([{ species: TETRA, quantity: 8 }]));
    expect(light.bioload.score).toBe(100);
    expect(light.bioload.headroom).toBeTruthy();
  });

  it("does not quote a specific number of extra fish", () => {
    const light = scoreTank(tank([{ species: TETRA, quantity: 8 }]));
    expect(light.bioload.headroom).not.toMatch(/\d/);
  });

  it("caps the overall score once the tank is genuinely overstocked", () => {
    const packed = scoreTank(tank([{ species: PREDATOR, quantity: 12 }], { length_cm: 60, width_cm: 30, height_cm: 35 }));
    expect(packed.bioload.loadPercent).toBeGreaterThan(110);
    expect(packed.overall!).toBeLessThanOrEqual(45);
  });
});

describe("aggression", () => {
  it("flags two of the same aggressive species", () => {
    const r = scoreTank(tank([{ species: BETTA, quantity: 2 }], { length_cm: 45, width_cm: 30, height_cm: 30 }));
    expect(r.compatibility.criticalConflicts.length).toBeGreaterThan(0);
    expect(r.compatibility.issues.some((i) => i.code === "conspecific-aggression")).toBe(true);
    expect(r.overall!).toBeLessThanOrEqual(45);
  });

  it("flags two different aggressive species", () => {
    const r = scoreTank(tank([
      { species: MBUNA_A, quantity: 4 },
      { species: MBUNA_B, quantity: 4 },
    ], { target_ph: 8.2, target_temp_c: 26 }));
    expect(r.compatibility.issues.some((i) => i.code === "both-aggressive")).toBe(true);
    expect(r.overall!).toBeLessThanOrEqual(45);
  });

  it("flags a part-group of an aggressive shoaling species", () => {
    const r = scoreTank(tank([{ species: MBUNA_A, quantity: 2 }], { target_ph: 8.2, target_temp_c: 26 }));
    expect(r.compatibility.issues.some((i) => i.code === "conspecific-partial-group")).toBe(true);
  });

  it("never scores an aggressive species in a group as clean", () => {
    const r = scoreTank(tank([{ species: MBUNA_A, quantity: 6 }], { target_ph: 8.2, target_temp_c: 26 }));
    expect(r.compatibility.score).toBeLessThan(90);
  });

  it("still flags predation", () => {
    const r = scoreTank(tank([
      { species: PREDATOR, quantity: 1 },
      { species: TETRA, quantity: 8 },
    ]));
    expect(r.compatibility.issues.some((i) => i.code === "predation")).toBe(true);
    expect(r.overall!).toBeLessThanOrEqual(45);
  });
});

describe("water", () => {
  it("flags a species the tank's own settings do not suit", () => {
    const r = scoreTank(tank([{ species: COLD, quantity: 6 }], { target_temp_c: 27 }));
    expect(r.water.misfits).toContain(COLD.common_name);
    expect(r.water.score).toBeLessThan(100);
  });

  it("passes a tank set up correctly for its stock", () => {
    const r = scoreTank(tank([{ species: TETRA, quantity: 10 }], { target_ph: 7.0, target_temp_c: 25 }));
    expect(r.water.score).toBe(100);
    expect(r.water.misfits).toHaveLength(0);
  });
});

describe("biotope", () => {
  it("never awards a badge to a tank of unmapped species", () => {
    const wanderer = species({ common_name: "Test wanderer", biotope_region: "unmapped" });
    const other = species({ common_name: "Test drifter", biotope_region: "unmapped" });
    const r = scoreTank(tank([
      { species: wanderer, quantity: 4 },
      { species: other, quantity: 4 },
    ]));
    expect(r.biome.badge).toBeUndefined();
  });

  it("still awards a badge to a genuine single-region tank", () => {
    const r = scoreTank(tank([{ species: TETRA, quantity: 10 }], { target_ph: 6.0, target_temp_c: 26 }));
    expect(r.biome.badge).toBe("true-biotope");
  });
});

describe("monotonicity", () => {
  const stockable = [TETRA, BETTA, MBUNA_A, PREDATOR, COLD];

  it("only ever raises the score when group pressure eases", () => {
    for (const sp of stockable) {
      let prevScore = -1;
      let prevGroupWeight = Infinity;
      for (let q = 1; q <= 14; q++) {
        const r: Scorecard = scoreTank(tank([{ species: sp, quantity: q }], { length_cm: 150, width_cm: 60, height_cm: 50 }));
        const groupWeight = r.compatibility.issues
          .filter((i) => GROUP_CODES.has(i.code))
          .reduce((t, i) => t + i.weight, 0);
        if (q > 1 && r.overall! > prevScore) {
          expect(groupWeight, `${sp.common_name} rose from ${prevScore} to ${r.overall} at ${q} with no group issue eased`).toBeLessThan(prevGroupWeight);
        }
        prevScore = r.overall!;
        prevGroupWeight = groupWeight;
      }
    }
  });

  it("rewards completing a shoal", () => {
    const lone = scoreTank(tank([{ species: TETRA, quantity: 1 }]));
    const full = scoreTank(tank([{ species: TETRA, quantity: TETRA.min_group_size }]));
    expect(full.overall!).toBeGreaterThan(lone.overall!);
  });
});

describe("sanity", () => {
  it("scores a well-planned community highly", () => {
    const cory = species({ common_name: "Test cory", is_schooling: true, min_group_size: 6, swim_zone: "bottom", bioload_factor: 1.4, adult_size_cm: 7, active: false });
    const r = scoreTank(tank([
      { species: TETRA, quantity: 12 },
      { species: cory, quantity: 8 },
    ], { length_cm: 120, width_cm: 45, height_cm: 45, target_ph: 7.0, target_temp_c: 25, plant_density: "medium" }));
    expect(r.overall!).toBeGreaterThanOrEqual(95);
    expect(r.priorityAction).toBeNull();
  });

  it("returns no score for an empty tank rather than a bad one", () => {
    expect(scoreTank(tank([])).overall).toBeNull();
  });
});
