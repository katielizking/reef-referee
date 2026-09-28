import { describe, expect, it } from "vitest";
import { confirmValues } from "./example-values";
import { NO_FILTERS, habitatLabel, likelyConflicts, matchesFilters, planFit } from "./species-fit";
import { DEFAULT_STATE } from "./tank-draft";
import type { Species, TankState } from "./types";

const fish = (id: string, name: string, scientific: string, o: Partial<Species> = {}) =>
  ({
    id,
    common_name: name,
    scientific_name: scientific,
    min_tank_litres: 40,
    adult_size_cm: 4,
    bioload_factor: 0.5,
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
    native_temp_max_c: 28,
    biotope_region: "se_asian_stream",
    native_habitat_type: "flowing_stream",
    ...o,
  }) as Species;

const betta = fish("betta", "Betta", "Betta splendens", {
  min_tank_litres: 20,
  adult_size_cm: 6,
  temperament: "aggressive",
  is_schooling: false,
  min_group_size: 1,
  fin_nipper: true,
  long_finned: true,
  active: false,
  swim_zone: "top",
  native_habitat_type: "still_blackwater",
});
const peacefulBetta = fish("imbellis", "Peaceful betta", "Betta imbellis", { long_finned: true });
const guppy = fish("guppy", "Guppy", "Poecilia reticulata", { long_finned: true });
const tigerBarb = fish("tiger", "Tiger barb", "Puntigrus tetrazona", {
  fin_nipper: true,
  temperament: "semi-aggressive",
});
const neon = fish("neon", "Neon tetra", "Paracheirodon innesi", { adult_size_cm: 3 });
const oscar = fish("oscar", "Oscar", "Astronotus ocellatus", {
  adult_size_cm: 30,
  predatory: true,
  min_tank_litres: 300,
  temperament: "semi-aggressive",
  is_schooling: false,
  min_group_size: 1,
});
const catalogue = [betta, peacefulBetta, guppy, tigerBarb, neon, oscar];
const confirmed: TankState = confirmValues(confirmValues(DEFAULT_STATE, "size"), "water");

describe("habitatLabel", () => {
  it("never shows raw database values", () => {
    expect(habitatLabel("flowing_stream")).toBe("flowing streams");
    expect(habitatLabel("new_habitat_type")).toBe("new habitat type");
  });
});

describe("library filters", () => {
  it("filters by volume, swimming length, water, group and level", () => {
    const f = (o: Partial<typeof NO_FILTERS>) =>
      catalogue.filter((s) => matchesFilters(s, { ...NO_FILTERS, ...o }));
    expect(f({ litres: 30 }).map((s) => s.id)).toEqual(["betta"]);
    // Betta: 6 cm × 4 (not active) = 24 cm of swimming length.
    expect(f({ lengthCm: 24 }).map((s) => s.id)).toContain("betta");
    expect(f({ lengthCm: 23 }).map((s) => s.id)).not.toContain("betta");
    expect(f({ tempC: 30 })).toEqual([]);
    expect(f({ ph: 6.5 })).toHaveLength(catalogue.length);
    expect(f({ groups: ["single"] }).map((s) => s.id)).toEqual(["betta", "oscar"]);
    expect(f({ zones: ["top"] }).map((s) => s.id)).toEqual(["betta"]);
  });
});

describe("likelyConflicts", () => {
  it("names real tank mates for a betta, never a betta or its own genus", () => {
    const text = likelyConflicts(betta, catalogue)
      .map((c) => `${c.title} ${c.detail}`)
      .join(" ");
    expect(text).toMatch(/Keep one Betta/);
    expect(text).toMatch(/avoid fish such as Guppy/);
    expect(text).toMatch(/fin-nippers such as Tiger barb/);
    expect(text).not.toMatch(/such as[^.]*\b(Betta|Peaceful betta)\b/);
  });

  it("uses the engine's predation thresholds", () => {
    const detail = likelyConflicts(oscar, catalogue).find(
      (c) => c.title === "Smaller fish",
    )?.detail;
    expect(detail).toMatch(/under about 8 cm as adults are likely to be eaten/);
    expect(detail).toMatch(/under about 12 cm are at risk/);
    expect(likelyConflicts(neon, catalogue).map((c) => c.title)).toContain("Larger predators");
  });
});

describe("planFit", () => {
  it("flags a fin-nipper conflict with the plan, with the engine's reason", () => {
    const plan = { ...confirmed, species: [{ species: betta, quantity: 1 }] };
    const fit = planFit(plan, tigerBarb);
    expect(fit.verdict).toBe("conflict");
    expect(fit.reasons.join(" ")).toMatch(/Tiger barb may nip Betta/);
  });

  it("says when a fish suits the plan and what the check cannot know", () => {
    const fit = planFit({ ...confirmed, species: [{ species: neon, quantity: 8 }] }, guppy);
    expect(fit.verdict).toBe("fits");
    expect(fit.limitations[0]).toMatch(/not your actual water/);
  });

  it("checks tank size alone when the plan has no fish, and says so", () => {
    const fit = planFit(DEFAULT_STATE, oscar);
    expect(fit.verdict).toBe("conflict");
    expect(fit.limitations.join(" ")).toMatch(/no fish yet/);
    expect(fit.limitations.join(" ")).toMatch(/example values/);
  });

  it("recognises fish already in the plan", () => {
    const plan = { ...confirmed, species: [{ species: neon, quantity: 8 }] };
    expect(planFit(plan, neon).verdict).toBe("in-plan");
  });
});
