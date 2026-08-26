import { describe, expect, it } from "vitest";
import { scoreTank, WEIGHTS } from "./index";
import type { BiotopeRegion, Filter, Species, TankState } from "../types";

function species(
  overrides: Partial<Species> & {
    id: string;
    common_name: string;
    biotope_region?: BiotopeRegion;
  },
): Species {
  return {
    id: overrides.id,
    common_name: overrides.common_name,
    scientific_name: overrides.common_name,
    min_tank_litres: 40,
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
    native_ph_min: 6.5,
    native_ph_max: 7.5,
    native_temp_min_c: 23,
    native_temp_max_c: 27,
    biotope_region: "unmapped",
    native_habitat_type: "stream",
    legal_in_australia: true,
    legal_status: "permitted",
    legal_note: null,
    legal_import_status: "unknown",
    legal_possession_status: "check_state_rules",
    legal_source_label: null,
    legal_source_url: null,
    legal_reviewed_on: null,
    legal_confidence: "incomplete",
    ...overrides,
  };
}

const filter: Filter = {
  id: "filter",
  name: "Test filter",
  rated_litres: 250,
  turnover_lph: 1000,
};

function tank(overrides: Partial<TankState> = {}): TankState {
  return {
    name: "Test tank",
    length_cm: 100,
    width_cm: 40,
    height_cm: 50,
    filter,
    maintenance_frequency: "weekly",
    target_ph: 7,
    target_temp_c: 25,
    plant_density: "medium",
    species: [],
    plants: [],
    hardscape: [],
    ...overrides,
  };
}

const tetra = species({
  id: "tetra",
  common_name: "Test tetra",
  biotope_region: "amazon_blackwater",
  is_schooling: true,
  min_group_size: 6,
  bioload_factor: 0.5,
  adult_size_cm: 3,
  native_ph_min: 6,
  native_ph_max: 7.2,
});

describe("scoreTank", () => {
  it("does not publish an overall score before fish are added", () => {
    const score = scoreTank(tank());
    expect(score.overall).toBeNull();
    expect(score.compatibility.issues).toEqual([]);
  });

  it("keeps a healthy compatible setup in the looking-good range", () => {
    const score = scoreTank(
      tank({ species: [{ species: tetra, quantity: 8 }], target_ph: 6.8 }),
    );
    expect(score.overall).not.toBeNull();
    expect(score.overall!).toBeGreaterThanOrEqual(75);
    expect(score.capReason).toBeNull();
  });

  it("flags a schooling shortfall with a structured, actionable issue", () => {
    const score = scoreTank(tank({ species: [{ species: tetra, quantity: 2 }] }));
    expect(score.compatibility.issues.some((issue) => issue.code === "shoal-shortfall")).toBe(true);
    expect(score.compatibility.fixes.some((fix) => /add 4 more/i.test(fix))).toBe(true);
  });

  it("treats unsafe same-species aggression as critical", () => {
    const fighter = species({
      id: "fighter",
      common_name: "Territorial fish",
      temperament: "aggressive",
    });
    const score = scoreTank(tank({ species: [{ species: fighter, quantity: 2 }] }));
    expect(score.compatibility.issues.some((issue) => issue.code === "conspecific-aggression")).toBe(true);
    expect(score.priorityAction?.category).toBe("compatibility");
    expect(score.overall!).toBeLessThanOrEqual(40);
    expect(score.capReason).toMatch(/critical compatibility/i);
  });

  it("caps a predator and prey combination", () => {
    const predator = species({
      id: "predator",
      common_name: "Large predator",
      adult_size_cm: 30,
      min_tank_litres: 150,
      predatory: true,
      temperament: "semi-aggressive",
    });
    const score = scoreTank(
      tank({
        species: [
          { species: predator, quantity: 1 },
          { species: tetra, quantity: 6 },
        ],
      }),
    );
    expect(score.compatibility.issues.some((issue) => issue.code === "predation")).toBe(true);
    expect(score.overall!).toBeLessThanOrEqual(40);
    expect(score.capReason).not.toBeNull();
  });

  it("scores the selected water against every fish", () => {
    const softWaterFish = species({
      id: "soft",
      common_name: "Soft-water fish",
      native_ph_min: 5,
      native_ph_max: 6.5,
      native_temp_min_c: 22,
      native_temp_max_c: 24,
    });
    const score = scoreTank(
      tank({
        target_ph: 8,
        target_temp_c: 28,
        species: [{ species: softWaterFish, quantity: 1 }],
      }),
    );
    expect(score.water.score).toBeLessThan(70);
    expect(score.water.misfits).toContain("Soft-water fish");
    expect(score.priorityAction?.category).toBe("water");
  });

  it("never rewards adding fish below the bioload plateau", () => {
    const one = scoreTank(tank({ species: [{ species: tetra, quantity: 6 }] }));
    const more = scoreTank(tank({ species: [{ species: tetra, quantity: 12 }] }));
    expect(more.bioload.score).toBeLessThanOrEqual(one.bioload.score);
  });

  it("caps dangerous overstocking and explains the cap", () => {
    const heavy = species({
      id: "heavy",
      common_name: "Heavy fish",
      bioload_factor: 4,
      min_tank_litres: 20,
    });
    const score = scoreTank(tank({ species: [{ species: heavy, quantity: 30 }] }));
    expect(score.bioload.loadPercent).toBeGreaterThan(110);
    expect(score.overall!).toBeLessThanOrEqual(45);
    expect(score.capReason).toMatch(/overstocked/i);
  });

  it("keeps regional catalogue status out of welfare scoring", () => {
    const permitted = species({ id: "a", common_name: "Reference fish" });
    const regionRestricted = species({
      id: "a",
      common_name: "Reference fish",
      legal_in_australia: false,
      legal_status: "prohibited",
    });
    const a = scoreTank(tank({ species: [{ species: permitted, quantity: 1 }] }));
    const b = scoreTank(tank({ species: [{ species: regionRestricted, quantity: 1 }] }));
    expect(b.overall).toBe(a.overall);
  });

  it("uses only welfare categories in the overall score", () => {
    const score = scoreTank(tank({ species: [{ species: tetra, quantity: 6 }] }));
    const expected = Math.round(
      score.compatibility.score * WEIGHTS.compatibility +
        score.bioload.score * WEIGHTS.bioload +
        score.space.score * WEIGHTS.space +
        score.water.score * WEIGHTS.water,
    );
    expect(score.overall).toBe(expected);
  });
});
