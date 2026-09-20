import { describe, expect, it } from "vitest";
import { checkSetup } from "./setup-check";
import { SHAPE_FILL, scoringState, waterLitres } from "./tank-shape";
import type { Species, TankState } from "./types";

function fish(overrides: Partial<Species> = {}): Species {
  return {
    id: "sp-1",
    common_name: "Bronze corydoras",
    scientific_name: "Corydoras aeneus",
    adult_size_cm: 6,
    min_tank_litres: 80,
    bioload_factor: 1,
    swim_zone: "bottom",
    temperament: "peaceful",
    is_schooling: true,
    min_group_size: 6,
    fin_nipper: false,
    predatory: false,
    long_finned: false,
    active: true,
    native_ph_min: 6,
    native_ph_max: 7.5,
    native_temp_min_c: 22,
    native_temp_max_c: 26,
    biotope_region: "south_american_river",
    ...overrides,
  } as unknown as Species;
}

function tank(overrides: Partial<TankState> = {}): TankState {
  return {
    name: "Test",
    length_cm: 90,
    width_cm: 35,
    height_cm: 40,
    filter: null,
    extra_filters: [],
    maintenance_frequency: "weekly",
    biological_media_level: "standard",
    filter_maturity: "established",
    cycle_status: "verified",
    cycle_method: "fishless",
    tank_age_weeks: 12,
    ammonia_mg_l: 0,
    nitrite_mg_l: 0,
    nitrate_mg_l: 10,
    water_tested_on: new Date().toISOString().slice(0, 10),
    seeded_media: false,
    target_ph: 6.8,
    target_temp_c: 25,
    plant_density: "light",
    species: [{ species: fish(), quantity: 6 }],
    plants: [],
    hardscape: [],
    ...overrides,
  };
}

describe("tank shape", () => {
  it("fills the box for a rectangle and holds less in a corner tank", () => {
    expect(waterLitres(tank())).toBeCloseTo(126, 5);
    expect(waterLitres(tank({ tank_shape: "corner" }))).toBeCloseTo(126 * SHAPE_FILL.corner, 5);
  });

  it("never reads bigger than the bounding box", () => {
    for (const fill of Object.values(SHAPE_FILL)) expect(fill).toBeLessThanOrEqual(1);
  });

  it("passes a smaller tank to the score for a shape that holds less", () => {
    const scored = scoringState(tank({ tank_shape: "corner" }));
    expect(scored.width_cm).toBeLessThan(35);
    expect(scoringState(tank()).width_cm).toBe(35);
  });
});

describe("setup checks", () => {
  it("treats bare glass under bottom dwellers as critical", () => {
    const issues = checkSetup(tank({ substrate: "bare" }));
    expect(issues[0]?.code).toBe("bare_glass_bottom_dweller");
    expect(issues[0]?.severity).toBe("critical");
  });

  it("cautions on coarse gravel under bottom dwellers", () => {
    const issues = checkSetup(tank({ substrate: "gravel" }));
    expect(issues.some((i) => i.code === "coarse_gravel_bottom_dweller")).toBe(true);
  });

  it("is happy with sand", () => {
    const issues = checkSetup(tank({ substrate: "sand" }));
    expect(issues.some((i) => i.code.includes("bottom_dweller"))).toBe(false);
  });

  it("flags a tropical target with no heater", () => {
    const issues = checkSetup(tank({ substrate: "sand", has_heater: false }));
    expect(issues.some((i) => i.code === "no_heater" && i.severity === "critical")).toBe(true);
  });

  it("flags plants with no light", () => {
    const issues = checkSetup(
      tank({ substrate: "sand", has_light: false, plant_density: "medium" }),
    );
    expect(issues.some((i) => i.code === "no_light_with_plants")).toBe(true);
  });

  it("flags CO2 in a tank with no plants", () => {
    const issues = checkSetup(tank({ substrate: "sand", has_co2: true }));
    expect(issues.some((i) => i.code === "co2_without_plants")).toBe(true);
  });

  it("notes a column tank under bottom dwellers", () => {
    const issues = checkSetup(tank({ substrate: "sand", tank_shape: "column" }));
    expect(issues.some((i) => i.code === "tall_tank_small_floor")).toBe(true);
  });

  it("says nothing about substrate with no bottom dwellers", () => {
    const issues = checkSetup(
      tank({ substrate: "bare", species: [{ species: fish({ swim_zone: "middle" }), quantity: 6 }] }),
    );
    expect(issues).toHaveLength(0);
  });

  it("puts criticals first", () => {
    const issues = checkSetup(tank({ substrate: "bare", has_co2: true }));
    expect(issues[0]?.severity).toBe("critical");
  });
});
