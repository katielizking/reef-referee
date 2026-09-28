import { describe, expect, it } from "vitest";
import { isUuid, speciesParam, speciesPath } from "./species-url";
import { parseSizeParam, sizeParam } from "./tank-links";
import {
  IDEA_COLLECTIONS,
  TANK_SIZE_PAGES,
  findCollection,
  ideasNearSize,
  slugify,
} from "./tank-idea-collections";
import { TANK_IDEAS } from "./tank-ideas";

describe("species URLs", () => {
  it("uses the slug when there is one, the id otherwise", () => {
    const id = "04ce8cb6-6277-462e-ad58-d80ac5239761";
    expect(isUuid(id)).toBe(true);
    expect(isUuid("betta")).toBe(false);
    expect(speciesPath({ id, slug: "betta" })).toBe("/species/betta");
    expect(speciesParam({ id })).toBe(id);
  });

  it("slugifies like the database function", () => {
    expect(slugify("Yellow-tailed Congo tetra")).toBe("yellow-tailed-congo-tetra");
    expect(slugify("Leggett's rainbowfish")).toBe("leggett-s-rainbowfish");
    expect(slugify("  Kuhli loach ")).toBe("kuhli-loach");
  });
});

describe("calculator links", () => {
  it("round-trips a tank size and rejects nonsense", () => {
    expect(parseSizeParam(sizeParam([100, 30, 40]))).toEqual([100, 30, 40]);
    expect(parseSizeParam("100x30")).toBeNull();
    expect(parseSizeParam("5x30x40")).toBeNull();
    expect(parseSizeParam("abcxdefxghi")).toBeNull();
  });
});

describe("tank idea collections", () => {
  it("never publishes an empty collection", () => {
    expect(IDEA_COLLECTIONS.every((c) => c.ideas.length > 0)).toBe(true);
  });

  it("answers the priority topics", () => {
    const litres120 = findCollection("size", "120-litres");
    expect(litres120?.ideas.some((i) => i.style === "Community")).toBe(true);
    expect(findCollection("fish", "betta")?.ideas.map((i) => i.slug)).toEqual([
      "betta-shaded-garden",
    ]);
    expect(TANK_SIZE_PAGES.map((p) => p.slug)).toContain("60-litre-tank");
  });

  it("gives every idea at least one size, fish and setup route", () => {
    for (const idea of TANK_IDEAS) {
      for (const kind of ["size", "fish", "type"] as const) {
        expect(
          IDEA_COLLECTIONS.some((c) => c.kind === kind && c.ideas.includes(idea)),
          `${idea.slug} ${kind}`,
        ).toBe(true);
      }
    }
  });

  it("keeps tank size pages honest about their dimensions", () => {
    for (const p of TANK_SIZE_PAGES) {
      const gross = p.dimensions.reduce((a, b) => a * b, 1) / 1000;
      expect(Math.abs(gross - p.litres) / p.litres).toBeLessThan(0.05);
    }
    expect(ideasNearSize(120).length).toBeGreaterThan(0);
  });
});

describe("preview images", () => {
  it("has a rendered image for every tank idea and page type", async () => {
    const { existsSync } = await import("node:fs");
    for (const idea of TANK_IDEAS) {
      expect(existsSync(`public/og/ideas/${idea.slug}.png`), idea.slug).toBe(true);
    }
    for (const name of ["default", "species", "plan", "tank-ideas"]) {
      expect(existsSync(`public/og/${name}.png`), name).toBe(true);
    }
  });
});
