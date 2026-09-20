import { describe, expect, it } from "vitest";
import {
  HIGH_SEVERITY_CAP,
  isWaterTestCurrent,
  scoreTank,
  WATER_TEST_MAX_AGE_DAYS,
  WEIGHTS,
} from "./index";
import type { BiotopeRegion, Filter, Species, TankState } from "../types";

describe("pea puffer group care", () => {
  const puffer = () =>
    species({
      id: "pea",
      common_name: "Pea puffer",
      scientific_name: "Carinotetraodon travancoricus",
      temperament: "aggressive",
      is_schooling: false,
      min_group_size: 1,
    });
  it("recognises group care even in an old saved species snapshot", () => {
    const s = scoreTank(
      tank({ plant_density: "heavy", species: [{ species: puffer(), quantity: 6 }] }),
    );
    expect(s.compatibility.issues.some((i) => i.code === "conspecific-aggression")).toBe(false);
    expect(s.compatibility.issues.some((i) => i.code === "aggression-standing")).toBe(true);
    expect(s.compatibility.fixes.join(" ")).not.toMatch(/keep a single/i);
  });
  it("warns for a solitary fish and partial groups without recommending isolation", () => {
    for (const quantity of [1, 2, 3, 5]) {
      const s = scoreTank(tank({ species: [{ species: puffer(), quantity }] }));
      expect(s.compatibility.issues.some((i) => i.code === "shoal-shortfall")).toBe(true);
      expect(s.compatibility.fixes.join(" ")).not.toMatch(/keep a single/i);
    }
  });
  it("does not approve a full group in an undersized tank", () => {
    const s = scoreTank(
      tank({
        length_cm: 40,
        width_cm: 25,
        height_cm: 30,
        species: [{ species: puffer(), quantity: 6 }],
      }),
    );
    expect(s.compatibility.issues.some((i) => i.code === "tank-too-small")).toBe(true);
  });
});

function species(
  overrides: Partial<Species> & {
    id: string;
    common_name: string;
    biotope_region?: BiotopeRegion;
  },
): Species {
  const { id, common_name, ...rest } = overrides;
  return {
    id,
    common_name,
    scientific_name: common_name,
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
    ...rest,
  };
}

const filter: Filter = {
  id: "filter",
  name: "Test filter",
  rated_litres: 250,
  turnover_lph: 1000,
  filter_type: "canister",
  biological_media_level: "substantial",
};

function tank(overrides: Partial<TankState> = {}): TankState {
  return {
    name: "Test tank",
    length_cm: 100,
    width_cm: 40,
    height_cm: 50,
    filter,
    maintenance_frequency: "weekly",
    biological_media_level: "substantial",
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
    const score = scoreTank(tank({ species: [{ species: tetra, quantity: 8 }], target_ph: 6.8 }));
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
    expect(
      score.compatibility.issues.some((issue) => issue.code === "conspecific-aggression"),
    ).toBe(true);
    expect(score.priorityAction?.category).toBe("compatibility");
    expect(score.overall!).toBeLessThanOrEqual(40);
    expect(score.capReason).toEqual(expect.any(String));
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

  it("does not accuse a small-mouthed predator of swallowing fish near its own size", () => {
    // A betta is predatory but a micropredator: it cannot swallow a deep-bodied
    // adult danio at a 2.8 length ratio. That gap is a caution, not a critical.
    const micropredator = species({
      id: "micropredator",
      common_name: "Small-mouthed predator",
      adult_size_cm: 7,
      predatory: true,
      temperament: "semi-aggressive",
    });
    const smallFish = species({
      id: "small-fish",
      common_name: "Small danio",
      adult_size_cm: 2.5,
      is_schooling: true,
      min_group_size: 6,
    });
    const score = scoreTank(
      tank({
        species: [
          { species: micropredator, quantity: 1 },
          { species: smallFish, quantity: 6 },
        ],
      }),
    );
    expect(score.compatibility.issues.some((issue) => issue.code === "predation")).toBe(false);
    expect(score.compatibility.criticalConflicts).toHaveLength(0);
    expect(score.compatibility.issues.some((issue) => issue.code === "predation-risk")).toBe(true);
  });

  it("does not flag predation below the 2.5 length ratio", () => {
    const predator = species({
      id: "mild-predator",
      common_name: "Mild predator",
      adult_size_cm: 8,
      predatory: true,
    });
    const tankMate = species({
      id: "tank-mate",
      common_name: "Similar-sized fish",
      adult_size_cm: 4,
    });
    const score = scoreTank(
      tank({
        species: [
          { species: predator, quantity: 1 },
          { species: tankMate, quantity: 1 },
        ],
      }),
    );
    expect(
      score.compatibility.issues.some(
        (issue) => issue.code === "predation" || issue.code === "predation-risk",
      ),
    ).toBe(false);
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

  it("keeps the experimental waste-load screen out of the headline score", () => {
    const light = species({
      id: "load",
      common_name: "Load reference",
      bioload_factor: 0.1,
    });
    const heavy = species({
      id: "load",
      common_name: "Load reference",
      bioload_factor: 12,
    });
    const a = scoreTank(tank({ species: [{ species: light, quantity: 6 }] }));
    const b = scoreTank(tank({ species: [{ species: heavy, quantity: 6 }] }));
    expect(a.bioload.loadBand).toBe("low");
    expect(b.bioload.loadBand).toBe("very-high");
    expect(b.overall).toBe(a.overall);
    expect(b.capReason).toBeNull();
  });

  it("does not mistake higher pump turnover for higher biological capacity", () => {
    const fastFilter: Filter = { ...filter, id: "fast", turnover_lph: 5000 };
    const slowFilter: Filter = { ...filter, id: "slow", turnover_lph: 200 };
    const a = scoreTank(tank({ filter: slowFilter, species: [{ species: tetra, quantity: 12 }] }));
    const b = scoreTank(tank({ filter: fastFilter, species: [{ species: tetra, quantity: 12 }] }));
    expect(b.bioload.loadPercent).toBe(a.bioload.loadPercent);
  });

  // Cycling moved to the tank tracker, which scores the water in a real tank.
  // The stocking plan still reports readiness, but no longer caps its own score
  // on it: a plan is judged on the fish, the room and the water targets.
  it("still reports an unverified cycle without capping the plan", () => {
    const score = scoreTank(
      tank({
        cycle_status: "unknown",
        ammonia_mg_l: null,
        nitrite_mg_l: null,
        water_tested_on: null,
        species: [{ species: tetra, quantity: 8 }],
      }),
    );
    expect(score.readiness.status).toBe("unverified");
    expect(score.capReason).toBeNull();
    expect(score.priorityAction?.category).not.toBe("readiness");
  });

  it("does not accept old zero readings as current cycle evidence", () => {
    const score = scoreTank(
      tank({
        water_tested_on: "2000-01-01",
        species: [{ species: tetra, quantity: 8 }],
      }),
    );
    expect(score.readiness.status).toBe("unverified");
    expect(score.readiness.issues.some((issue) => issue.code === "water-test-stale")).toBe(true);
  });

  it("uses a bounded, explicit water-test freshness window", () => {
    const now = new Date("2026-08-27T12:00:00Z");
    expect(isWaterTestCurrent("2026-08-20", now)).toBe(true);
    expect(isWaterTestCurrent("2026-08-19", now)).toBe(false);
    expect(WATER_TEST_MAX_AGE_DAYS).toBe(7);
  });

  it("still flags detectable ammonia as a stop signal, reported not scored", () => {
    const score = scoreTank(
      tank({ ammonia_mg_l: 0.25, species: [{ species: tetra, quantity: 8 }] }),
    );
    expect(score.readiness.status).toBe("unsafe");
    expect(score.readiness.issues.some((issue) => issue.code === "ammonia-detected")).toBe(true);
    // The plan is not capped for it; the tank tracker owns the stop signal now.
    expect(score.capReason).toBeNull();
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
        score.space.score * WEIGHTS.space +
        score.water.score * WEIGHTS.water,
    );
    expect(score.overall).toBe(expected);
  });

  describe("severity caps", () => {
    it("treats a far-too-small tank as do-not-stock even when everything else is fine", () => {
      const bigShoal = species({
        id: "bala",
        common_name: "Big shoaler",
        min_tank_litres: 1000,
        adult_size_cm: 30,
        active: true,
        is_schooling: true,
        min_group_size: 3,
      });
      const score = scoreTank(tank({ species: [{ species: bigShoal, quantity: 3 }] }));
      expect(score.space.issues?.some((i) => i.severity === "critical")).toBe(true);
      expect(score.overall!).toBeLessThanOrEqual(40);
      expect(score.capReason).toMatch(/far too small/i);
    });

    it("never reports a plan with a high-severity issue as looking good", () => {
      const loner = species({
        id: "loner",
        common_name: "Lonely tetra",
        is_schooling: true,
        min_group_size: 6,
      });
      const score = scoreTank(tank({ species: [{ species: loner, quantity: 1 }] }));
      expect(score.compatibility.issues.some((i) => i.severity === "high")).toBe(true);
      expect(score.overall!).toBeLessThanOrEqual(HIGH_SEVERITY_CAP);
      expect(score.capReason).not.toBeNull();
    });

    it("treats nippers with a slow long-finned fish as high risk, even in a full group", () => {
      const nipper = species({
        id: "nipper",
        common_name: "Nippy tetra",
        fin_nipper: true,
        is_schooling: true,
        min_group_size: 6,
        active: true,
      });
      const slow = species({
        id: "slow",
        common_name: "Slow long fin",
        long_finned: true,
        active: false,
      });
      const fast = species({
        id: "fast",
        common_name: "Fast long fin",
        long_finned: true,
        active: true,
      });

      const withSlow = scoreTank(
        tank({
          species: [
            { species: nipper, quantity: 8 },
            { species: slow, quantity: 1 },
          ],
        }),
      );
      const withFast = scoreTank(
        tank({
          species: [
            { species: nipper, quantity: 8 },
            { species: fast, quantity: 1 },
          ],
        }),
      );
      const nip = (s: typeof withSlow) =>
        s.compatibility.issues.find((i) => i.code === "fin-nipping");
      expect(nip(withSlow)?.severity).toBe("high");
      expect(nip(withFast)?.severity).toBe("medium");
      expect(withSlow.overall!).toBeLessThanOrEqual(HIGH_SEVERITY_CAP);
    });
  });
});
