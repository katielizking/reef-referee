import { describe, expect, it } from "vitest";

import { checkInvertebrates, invertebrateBioload } from "./invert-check";
import type { Invertebrate, Species, TankState } from "./types";

const invert = (over: Partial<Invertebrate> = {}): Invertebrate => ({
  id: "inv-1",
  common_name: "Cherry shrimp",
  scientific_name: "Neocaridina davidi",
  invert_group: "shrimp",
  min_tank_litres: 20,
  adult_size_cm: 4,
  bioload_factor: 0.03,
  temperament: "peaceful",
  min_group_size: 10,
  predatory: false,
  fish_risk_note: "Most fish over 5 cm will eat small shrimp.",
  native_ph_min: 6.5,
  native_ph_max: 8,
  native_temp_min_c: 18,
  native_temp_max_c: 28,
  biotope_region: "east_asian_stream",
  algae_role: null,
  care_notes: null,
  care_source_label: null,
  care_source_url: null,
  care_reviewed_on: null,
  care_confidence: "low",
  ...over,
});

const fish = (over: Partial<Species> = {}): Species =>
  ({
    id: "sp-1",
    common_name: "Neon tetra",
    scientific_name: "Paracheirodon innesi",
    min_tank_litres: 60,
    adult_size_cm: 3,
    bioload_factor: 0.5,
    swim_zone: "mid",
    temperament: "peaceful",
    is_schooling: true,
    min_group_size: 10,
    fin_nipper: false,
    predatory: false,
    long_finned: false,
    active: true,
    native_ph_min: 5,
    native_ph_max: 7,
    native_temp_min_c: 22,
    native_temp_max_c: 27,
    biotope_region: "amazon_blackwater",
    native_habitat_type: "still_blackwater",
    legal_in_australia: true,
    legal_status: "permitted",
    legal_note: null,
    ...over,
  }) as Species;

const tank = (over: Partial<TankState> = {}): TankState =>
  ({
    name: "Test",
    length_cm: 90,
    width_cm: 40,
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
    water_tested_on: null,
    seeded_media: false,
    target_ph: 7,
    target_temp_c: 25,
    plant_density: "medium",
    species: [],
    invertebrates: [],
    plants: [],
    hardscape: [],
    ...over,
  }) as TankState;

describe("checkInvertebrates", () => {
  it("says nothing when there are no invertebrates", () => {
    expect(checkInvertebrates(tank())).toEqual([]);
  });

  it("clears a well planned shrimp colony on its own", () => {
    const issues = checkInvertebrates(
      tank({ invertebrates: [{ invertebrate: invert(), quantity: 12 }] }),
    );
    expect(issues).toEqual([]);
  });

  it("flags a tank smaller than the species needs", () => {
    const issues = checkInvertebrates(
      tank({
        length_cm: 20,
        width_cm: 20,
        height_cm: 20,
        invertebrates: [{ invertebrate: invert(), quantity: 12 }],
      }),
    );
    expect(issues.some((i) => i.code === "tank_too_small" && i.severity === "critical")).toBe(true);
  });

  it("flags a group below the minimum", () => {
    const issues = checkInvertebrates(
      tank({ invertebrates: [{ invertebrate: invert(), quantity: 3 }] }),
    );
    expect(issues.some((i) => i.code === "group_too_small")).toBe(true);
  });

  it("flags fish that will eat the shrimp", () => {
    const issues = checkInvertebrates(
      tank({
        species: [{ species: fish({ adult_size_cm: 15, predatory: true }), quantity: 1 }],
        invertebrates: [{ invertebrate: invert(), quantity: 12 }],
      }),
    );
    const eaten = issues.find((i) => i.code === "eaten_by_fish");
    expect(eaten?.severity).toBe("critical");
  });

  it("does not treat a small peaceful fish as a shrimp threat", () => {
    const issues = checkInvertebrates(
      tank({
        species: [{ species: fish({ adult_size_cm: 3 }), quantity: 10 }],
        invertebrates: [{ invertebrate: invert(), quantity: 12 }],
      }),
    );
    expect(issues.some((i) => i.code === "eaten_by_fish")).toBe(false);
  });

  it("flags a predatory invertebrate kept with smaller tank mates", () => {
    const issues = checkInvertebrates(
      tank({
        species: [{ species: fish({ adult_size_cm: 3 }), quantity: 8 }],
        invertebrates: [
          {
            invertebrate: invert({
              id: "inv-2",
              common_name: "Whisker shrimp",
              adult_size_cm: 6,
              predatory: true,
              min_group_size: 1,
              fish_risk_note: "Will attack small fish and dwarf shrimp.",
            }),
            quantity: 1,
          },
        ],
      }),
    );
    expect(issues.some((i) => i.code === "hunts_tank_mates" && i.severity === "critical")).toBe(
      true,
    );
  });

  it("treats a prohibited species as critical", () => {
    const issues = checkInvertebrates(
      tank({
        invertebrates: [
          {
            invertebrate: invert({
              id: "inv-4",
              common_name: "Red swamp crayfish",
              min_group_size: 1,
              legal_status: "prohibited",
              legal_note: "Prohibited in Queensland.",
            }),
            quantity: 1,
          },
        ],
      }),
    );
    const legal = issues.find((i) => i.code === "check_local_rules");
    expect(legal?.severity).toBe("critical");
    expect(legal?.reason).toContain("Prohibited");
  });

  it("notes species that need dry land", () => {
    const issues = checkInvertebrates(
      tank({
        invertebrates: [
          {
            invertebrate: invert({
              id: "inv-3",
              common_name: "Vampire crab",
              invert_group: "crab",
              min_tank_litres: 19,
              adult_size_cm: 3,
              min_group_size: 1,
              predatory: false,
              needs_land: true,
            }),
            quantity: 2,
          },
        ],
      }),
    );
    expect(issues.some((i) => i.code === "needs_land" && i.severity === "critical")).toBe(true);
  });

  it("lists critical issues first", () => {
    const issues = checkInvertebrates(
      tank({
        length_cm: 20,
        width_cm: 20,
        height_cm: 20,
        invertebrates: [{ invertebrate: invert(), quantity: 2 }],
      }),
    );
    expect(issues[0].severity).toBe("critical");
  });
});

describe("invertebrateBioload", () => {
  it("adds up the group loads", () => {
    const total = invertebrateBioload(
      tank({ invertebrates: [{ invertebrate: invert(), quantity: 10 }] }),
    );
    expect(total).toBeCloseTo(0.3, 5);
  });
});
