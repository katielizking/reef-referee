import { describe, it, expect } from "vitest";
import { TANK_IDEAS, buildIdeaTank } from "./tank-ideas";
import type { Species } from "./types";
describe("tank idea handoff", () => {
  it("loads exact quantities and clears all previous equipment and readiness", () => {
    const idea = TANK_IDEAS.find((i) => i.slug === "pea-puffer-jungle")!;
    const fish = { id: "puffer", scientific_name: "Carinotetraodon travancoricus" } as Species;
    const tank = buildIdeaTank(idea, [fish]);
    expect(tank.species).toEqual([{ species: fish, quantity: 6 }]);
    expect(tank.filter).toBeNull();
    expect(tank.extra_filters).toEqual([]);
    expect(tank.cycle_status).toBe("unknown");
    expect(tank.water_tested_on).toBeNull();
    expect(tank.invertebrates).toEqual([]);
    expect(tank.overrides).toBeUndefined();
  });
  it("fails visibly instead of silently dropping missing fish", () => {
    expect(() => buildIdeaTank(TANK_IDEAS[0], [])).toThrow("unavailable");
  });
});

// Catalogue rows for the fish the ideas use, taken from supabase/migrations.
// Refresh this snapshot when a species' care data changes.
import catalogue from "./__fixtures__/idea-species.json";
import { scoreTank } from "./scoring";

describe("every tank idea is a sound plan", () => {
  it.each(TANK_IDEAS.map((i) => [i.slug, i] as const))(
    "%s has no serious welfare issue",
    (_slug, idea) => {
      const s = scoreTank(buildIdeaTank(idea, catalogue as unknown as Species[]));
      const serious = [
        ...s.compatibility.issues,
        ...(s.space.issues ?? []),
        ...(s.water.issues ?? []),
      ]
        .filter((i) => i.severity === "critical" || i.severity === "high")
        .map((i) => i.reason);
      expect(serious).toEqual([]);
      expect(s.overall).toBeGreaterThanOrEqual(75);
    },
  );
});
