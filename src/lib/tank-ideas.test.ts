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
