import { describe, expect, it } from "vitest";

import { scoreTank } from "./scoring";
import { suggestCompatibleSpecies } from "./suggestions";
import type { Species, TankState } from "./types";

function makeSpecies(overrides: Partial<Species> & { id: string }): Species {
  return {
    common_name: `Fish ${overrides.id}`,
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
    ...overrides,
  } as unknown as Species;
}

const resident = makeSpecies({ id: "resident" });
const goodMatch = makeSpecies({ id: "good", common_name: "Good match" });
const tooBig = makeSpecies({ id: "big", min_tank_litres: 800, adult_size_cm: 30 });
const coldWater = makeSpecies({
  id: "cold",
  native_temp_min_c: 10,
  native_temp_max_c: 18,
  native_ph_min: 7.5,
  native_ph_max: 8.5,
});
const bully = makeSpecies({
  id: "bully",
  temperament: "aggressive",
  predatory: true,
  min_group_size: 1,
  is_schooling: false,
  adult_size_cm: 20,
});

function tank(overrides: Partial<TankState> = {}): TankState {
  return {
    name: "Test",
    length_cm: 120,
    width_cm: 45,
    height_cm: 45,
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
    species: [{ species: resident, quantity: 8 }],
    plants: [],
    hardscape: [],
    ...overrides,
  };
}

const catalogue = [resident, goodMatch, tooBig, coldWater, bully];

describe("compatible species suggestions", () => {
  it("suggests nothing for an empty tank", () => {
    expect(suggestCompatibleSpecies(tank({ species: [] }), catalogue)).toEqual([]);
  });

  it("never suggests a fish already in the plan", () => {
    const ids = suggestCompatibleSpecies(tank(), catalogue).map((s) => s.species.id);
    expect(ids).not.toContain("resident");
  });

  it("leaves out fish the tank is too small for, the wrong water, and bullies", () => {
    const ids = suggestCompatibleSpecies(tank(), catalogue).map((s) => s.species.id);
    expect(ids).not.toContain("big");
    expect(ids).not.toContain("cold");
    expect(ids).not.toContain("bully");
    expect(ids).toContain("good");
  });

  it("names the group a shoaling fish needs", () => {
    const match = suggestCompatibleSpecies(tank(), catalogue).find((s) => s.species.id === "good")!;
    expect(match.groupNote).toContain("6");
  });

  it("never suggests something that would drop the score", () => {
    const base = scoreTank(tank()).overall!;
    for (const suggestion of suggestCompatibleSpecies(tank(), catalogue)) {
      const next = scoreTank({
        ...tank(),
        species: [
          ...tank().species,
          {
            species: suggestion.species,
            quantity: Math.max(1, suggestion.species.min_group_size),
          },
        ],
      }).overall!;
      expect(next).toBeGreaterThanOrEqual(base - 2);
    }
  });
});
