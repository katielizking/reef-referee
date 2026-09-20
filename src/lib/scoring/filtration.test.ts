import { describe, expect, it } from "vitest";
import { combinedFiltration } from "./index";
import type { Filter, TankState } from "../types";

function filter(id: string, turnover: number): Filter {
  return {
    id,
    name: id,
    rated_litres: 200,
    turnover_lph: turnover,
    filter_type: "canister",
    biological_media_level: "standard",
  };
}

function state(overrides: Partial<TankState> = {}): TankState {
  return {
    name: "Test tank",
    length_cm: 100,
    width_cm: 40,
    height_cm: 50,
    filter: filter("main", 800),
    extra_filters: [],
    maintenance_frequency: "weekly",
    biological_media_level: "standard",
    filter_maturity: "established",
    cycle_status: "verified",
    cycle_method: "fishless",
    tank_age_weeks: 8,
    ammonia_mg_l: 0,
    nitrite_mg_l: 0,
    nitrate_mg_l: 10,
    water_tested_on: new Date().toISOString().slice(0, 10),
    seeded_media: false,
    target_ph: 7,
    target_temp_c: 25,
    plant_density: "medium",
    species: [],
    plants: [],
    hardscape: [],
    ...overrides,
  };
}

describe("combinedFiltration", () => {
  it("reports no filter when none is chosen", () => {
    const result = combinedFiltration(state({ filter: null }));
    expect(result.hasFilter).toBe(false);
    expect(result.count).toBe(0);
  });

  it("adds flow across every filter", () => {
    const result = combinedFiltration(
      state({
        extra_filters: [
          {
            filter: filter("sponge", 200),
            biological_media_level: "standard",
            filter_maturity: "established",
          },
        ],
      }),
    );
    expect(result.count).toBe(2);
    expect(result.turnover_lph).toBe(1000);
  });

  it("takes the best media level present", () => {
    const result = combinedFiltration(
      state({
        biological_media_level: "minimal",
        extra_filters: [
          {
            filter: filter("sponge", 200),
            biological_media_level: "substantial",
            filter_maturity: "established",
          },
        ],
      }),
    );
    expect(result.biological_media_level).toBe("substantial");
  });

  it("takes the least mature media, because a new filter cannot carry the load", () => {
    const result = combinedFiltration(
      state({
        extra_filters: [
          {
            filter: filter("sponge", 200),
            biological_media_level: "substantial",
            filter_maturity: "new",
          },
        ],
      }),
    );
    expect(result.filter_maturity).toBe("new");
  });

  it("treats a missing extra-filter list the same as an empty one", () => {
    const base = state();
    delete base.extra_filters;
    const result = combinedFiltration(base);
    expect(result.count).toBe(1);
    expect(result.turnover_lph).toBe(800);
  });
});
