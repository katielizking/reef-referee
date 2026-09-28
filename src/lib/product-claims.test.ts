import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scoreTank, WEIGHTS } from "./scoring";
import { DEFAULT_STATE } from "./tank-draft";
import type { Species } from "./types";

/**
 * Product claims have to follow scoring behaviour. If you change what feeds
 * the score, this file fails until the claims across the site, the blog seeds
 * and the docs are updated to match. See "Product claims" in AGENTS.md.
 */

const SCORED = ["compatibility", "space", "water"];

describe("scoring behaviour the claims rely on", () => {
  it("scores compatibility, space and water only", () => {
    expect(Object.keys(WEIGHTS).sort()).toEqual([...SCORED].sort());
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it("never lets the waste-load estimate change the score", () => {
    const fish = {
      id: "tetra",
      common_name: "Neon tetra",
      scientific_name: "Paracheirodon innesi",
      min_tank_litres: 40,
      adult_size_cm: 3,
      bioload_factor: 0.5,
      swim_zone: "mid",
      temperament: "peaceful",
      is_schooling: true,
      min_group_size: 6,
      fin_nipper: false,
      predatory: false,
      long_finned: false,
      active: true,
      native_ph_min: 5,
      native_ph_max: 7.5,
      native_temp_min_c: 20,
      native_temp_max_c: 26,
      biotope_region: "amazon_blackwater",
      native_habitat_type: "still_blackwater",
    } as Species;
    const light = scoreTank({ ...DEFAULT_STATE, species: [{ species: fish, quantity: 8 }] });
    const heavy = scoreTank({
      ...DEFAULT_STATE,
      species: [{ species: { ...fish, bioload_factor: 50 }, quantity: 8 }],
    });
    expect(heavy.bioload.loadBand).toBe("very-high");
    expect(heavy.overall).toBe(light.overall);
  });
});

// Migrations are excluded: they keep old wording on purpose, e.g. the text a
// correction migration replaces.
const ROOTS = ["src", "supabase/seed", "docs", "README.md"];
const TEXT_FILE = /\.(tsx?|md|sql)$/;

function files(path: string): string[] {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path).flatMap((name) => files(join(path, name)));
}

const sentences = ROOTS.flatMap(files)
  .filter((f) => TEXT_FILE.test(f) && !/\.test\.tsx?$/.test(f))
  .flatMap((file) =>
    readFileSync(file, "utf8")
      .split(/(?<=[.!?])\s+|\n/)
      .map((text) => ({ file, text: text.trim() })),
  );

const NEGATED = /\b(not|never|without|beside|separate(ly)?|excluded?)\b|n't\b/i;

describe("product claims", () => {
  it("never say waste load or cycling feeds the score", () => {
    const bad = sentences.filter(
      ({ text }) =>
        /\bscore\b/i.test(text) &&
        /\b(built from|made (up )?(of|from)|combines|includes|factors in|feeds|contributes)\b/i.test(
          text,
        ) &&
        /\b(bioload|waste|stocking level|cycl\w*)\b/i.test(text) &&
        !NEGATED.test(text),
    );
    expect(bad).toEqual([]);
  });

  it("never claim every species or row carries a source", () => {
    const bad = sentences.filter(({ text }) =>
      /\b(each|every|all)\b[^.]{0,60}\b(rows?|species|fish|profiles?|entr(y|ies))\b[^.]{0,60}\b(source link|sourced|cited|citations?)\b/i.test(
        text,
      ),
    );
    expect(bad).toEqual([]);
  });

  it("catches the claims this guard was written for", () => {
    const composition =
      "The score is built from compatibility, bioload, space and water, and that last one is the part almost nothing else checks.";
    expect(/\bscore\b/i.test(composition) && !NEGATED.test(composition)).toBe(true);
    expect(
      /\b(each|every|all)\b[^.]{0,60}\b(rows?)\b[^.]{0,60}\b(source link)\b/i.test(
        "201 freshwater fish and 31 shrimp, snails and crabs, each row carrying its source link.",
      ),
    ).toBe(true);
  });
});
