import { describe, expect, it } from "vitest";

import { scoreTank } from "./scoring";
import type { Species, TankState } from "./types";
import { waterChangeGuidance } from "./water-change";

const fish = {
  id: "f1",
  common_name: "Test tetra",
  scientific_name: "Testus testus",
  min_tank_litres: 40,
  adult_size_cm: 4,
  bioload_factor: 1,
  swim_zone: "mid",
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
  native_temp_max_c: 27,
  biotope_region: "amazon_blackwater",
  native_habitat_type: "stream",
  legal_in_australia: true,
  legal_status: "permitted",
  legal_note: null,
  legal_import_status: "permitted_with_conditions",
  legal_possession_status: "generally_permitted_check_state",
  legal_source_label: null,
  legal_source_url: null,
  legal_reviewed_on: null,
  legal_confidence: "verified",
} as unknown as Species;

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
    species: [{ species: fish, quantity: 8 }],
    plants: [],
    hardscape: [],
    ...overrides,
  };
}

function guidanceFor(state: TankState) {
  return waterChangeGuidance(state, scoreTank(state));
}

describe("water change guidance", () => {
  it("gives nothing without fish", () => {
    expect(guidanceFor(tank({ species: [] }))).toBeNull();
  });

  it("stays within a sane range and reports litres", () => {
    const g = guidanceFor(tank())!;
    expect(g.weeklyPercent).toBeGreaterThanOrEqual(10);
    expect(g.weeklyPercent).toBeLessThanOrEqual(50);
    expect(g.litres).toBe(Math.round((126 * g.weeklyPercent) / 100));
  });

  it("asks for more water when the tank is heavily stocked", () => {
    const light = guidanceFor(tank())!;
    const heavy = guidanceFor(tank({ species: [{ species: fish, quantity: 60 }] }))!;
    expect(heavy.weeklyPercent).toBeGreaterThan(light.weeklyPercent);
  });

  it("nudges anyone not changing water weekly", () => {
    expect(guidanceFor(tank())!.frequencyNote).toBeNull();
    expect(guidanceFor(tank({ maintenance_frequency: "monthly" }))!.frequencyNote).toContain(
      "weekly",
    );
  });
});
