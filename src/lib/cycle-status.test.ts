import { describe, expect, it } from "vitest";
import {
  cycleVerdict,
  isTestCurrent,
  nitrateNote,
  testAgeDays,
  type WaterTest,
} from "./cycle-status";

const NOW = new Date("2026-09-20T00:00:00Z");

function test(partial: Partial<WaterTest>): WaterTest {
  return {
    id: "t",
    tank_id: "tank",
    tested_on: "2026-09-19",
    ammonia_mg_l: 0,
    nitrite_mg_l: 0,
    nitrate_mg_l: 10,
    ph: 7,
    temp_c: 25,
    note: null,
    created_at: NOW.toISOString(),
    ...partial,
  };
}

describe("test age", () => {
  it("counts whole days", () => {
    expect(testAgeDays("2026-09-18", NOW)).toBe(2);
    expect(testAgeDays(null, NOW)).toBeNull();
  });

  it("treats results older than a week as out of date", () => {
    expect(isTestCurrent("2026-09-19", NOW)).toBe(true);
    expect(isTestCurrent("2026-09-01", NOW)).toBe(false);
  });
});

describe("cycle verdict", () => {
  const cycled = { cycle_status: "verified" as const, filter_maturity: "established" as const };

  it("stops stocking when ammonia is showing, whatever the tank says", () => {
    const v = cycleVerdict(cycled, test({ ammonia_mg_l: 0.5 }), NOW);
    expect(v.stage).toBe("unsafe");
    expect(v.severity).toBe("critical");
  });

  it("stops stocking when nitrite is showing", () => {
    expect(cycleVerdict(cycled, test({ nitrite_mg_l: 0.25 }), NOW).stage).toBe("unsafe");
  });

  it("reports a cycle that has not started", () => {
    expect(
      cycleVerdict({ cycle_status: "not_started", filter_maturity: "new" }, null, NOW).stage,
    ).toBe("not_started");
  });

  it("will not call a tank cycled without a current test", () => {
    expect(cycleVerdict(cycled, null, NOW).stage).toBe("unverified");
    expect(cycleVerdict(cycled, test({ tested_on: "2026-09-01" }), NOW).stage).toBe("unverified");
  });

  it("stays cautious while the media is new", () => {
    expect(cycleVerdict({ ...cycled, filter_maturity: "new" }, test({}), NOW).stage).toBe(
      "cycling",
    );
  });

  it("calls it cycled on current zero results", () => {
    const v = cycleVerdict(cycled, test({}), NOW);
    expect(v.stage).toBe("ready");
    expect(v.severity).toBe("good");
  });
});

describe("nitrate note", () => {
  it("says nothing without a reading", () => {
    expect(nitrateNote(test({ nitrate_mg_l: null }))).toBeNull();
  });

  it("escalates with the reading", () => {
    expect(nitrateNote(test({ nitrate_mg_l: 10 }))).toContain("normal");
    expect(nitrateNote(test({ nitrate_mg_l: 45 }))).toContain("climbing");
    expect(nitrateNote(test({ nitrate_mg_l: 90 }))).toContain("very high");
  });
});
