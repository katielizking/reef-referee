import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import type { WaterTest } from "./cycle-status";
import type { FullTank } from "./data";
import { DEFAULT_STATE } from "./tank-draft";
import {
  communityDraftForPlan,
  planReview,
  planSlugFromLink,
  stateFromFullTank,
  testChanges,
  trackedTankFromPlan,
} from "./tank-journey";
import type { Species, TankRow, TankState } from "./types";

const tetra = {
  id: "neon",
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
  biotope_region: "amazon_blackwater",
  native_habitat_type: "still_blackwater",
  native_ph_min: 5,
  native_ph_max: 7,
  native_temp_min_c: 20,
  native_temp_max_c: 26,
} as Species;

const row = {
  id: "plan-1",
  name: "Living room 60",
  share_slug: "abc123",
  length_cm: 60,
  width_cm: 30,
  height_cm: 35,
  tank_shape: "corner",
  biological_media_level: "substantial",
  filter_maturity: "new",
  cycle_status: "cycling",
  cycle_method: "fishless",
  tank_age_weeks: 2,
  seeded_media: true,
  maintenance_frequency: "weekly",
  target_ph: 6.5,
  target_temp_c: 24,
  plant_density: "heavy",
} as unknown as TankRow;

const full: FullTank = {
  tank: row,
  filter: null,
  filters: [],
  species: [{ species: tetra, quantity: 10 }],
  invertebrates: [],
  plants: [],
  hardscape: [],
};

const test = (tested_on: string, o: Partial<WaterTest>) =>
  ({
    id: tested_on,
    tank_id: "t",
    tested_on,
    ammonia_mg_l: 0,
    nitrite_mg_l: 0,
    nitrate_mg_l: 10,
    ph: null,
    temp_c: null,
    note: null,
    ...o,
  }) as WaterTest;

describe("plan → tracked tank", () => {
  it("keeps the plan's name, links it and uses the water it holds", () => {
    const t = trackedTankFromPlan(row);
    expect(t.name).toBe("Living room 60");
    expect(t.plan_id).toBe("plan-1");
    // 63 L box × 0.79 for a corner tank.
    expect(t.litres).toBe(50);
    expect(t.biological_media_level).toBe("generous");
    expect(t).toMatchObject({
      cycle_status: "cycling",
      filter_maturity: "new",
      seeded_media: true,
    });
  });
});

describe("review changes", () => {
  it("reports what moved between tests, flagging any ammonia", () => {
    const notes = testChanges(
      test("2026-09-20", { ammonia_mg_l: 0.25, nitrate_mg_l: 20 }),
      test("2026-09-13", { ammonia_mg_l: 0, nitrate_mg_l: 10 }),
    );
    expect(notes).toEqual([
      { tone: "critical", text: "Ammonia rose from 0 to 0.25 mg/L since 2026-09-13." },
      { tone: "caution", text: "Nitrate rose from 10 to 20 mg/L since 2026-09-13." },
    ]);
  });

  it("compares readings with the plan and names fish outside their range", () => {
    const plan: TankState = { ...DEFAULT_STATE, ...stateFromFullTank(full) };
    const outside = planReview(plan, test("2026-09-20", { ph: 7.6, temp_c: 24 }));
    expect(outside[0]).toEqual({
      tone: "caution",
      text: "pH 7.6 is outside the range for Neon tetra. The plan targets pH 6.5.",
    });
    expect(outside[1].tone).toBe("good");
    expect(planReview(plan, null)).toEqual([]);
  });
});

describe("asking the community", () => {
  it("drafts an editable question that links the plan", () => {
    const draft = communityDraftForPlan(full, "abc123");
    expect(draft.flair).toBe("Question");
    expect(draft.title).toBe("Feedback on my 50 L plan: Living room 60");
    expect(draft.body).toContain("- 10 × Neon tetra");
    expect(draft.body.trimEnd().endsWith("My question:")).toBe(true);
    expect(planSlugFromLink(draft.link_url)).toBe("abc123");
  });

  it("only treats FishTankr plan links as plans", () => {
    expect(planSlugFromLink("https://example.com/t/abc123")).toBeNull();
    expect(planSlugFromLink("not a url")).toBeNull();
    expect(planSlugFromLink(null)).toBeNull();
  });
});
