// Cycle verdict for a tracked tank. This is deliberately separate from the
// stocking score: the score judges a plan, this judges the water in a real tank.

export type CycleStatus = "unknown" | "not_started" | "cycling" | "verified";
export type CycleMethod = "unknown" | "fishless" | "seeded" | "plant_only" | "fish_in";
export type MediaMaturity = "unknown" | "new" | "maturing" | "established";
export type MediaLevel = "minimal" | "standard" | "generous";

export interface TrackedTank {
  id: string;
  name: string;
  litres: number | null;
  tank_age_weeks: number | null;
  cycle_status: CycleStatus;
  cycle_method: CycleMethod;
  filter_maturity: MediaMaturity;
  biological_media_level: MediaLevel;
  seeded_media: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaterTest {
  id: string;
  tank_id: string;
  tested_on: string;
  ammonia_mg_l: number | null;
  nitrite_mg_l: number | null;
  nitrate_mg_l: number | null;
  ph: number | null;
  temp_c: number | null;
  note: string | null;
  created_at: string;
}

export const TEST_MAX_AGE_DAYS = 7;

export const CYCLE_STATUS_LABEL: Record<CycleStatus, string> = {
  unknown: "Not sure",
  not_started: "Not started",
  cycling: "Cycling",
  verified: "Cycled",
};

export const CYCLE_METHOD_LABEL: Record<CycleMethod, string> = {
  unknown: "Not sure",
  fishless: "Fishless",
  seeded: "Seeded media",
  plant_only: "Plants only",
  fish_in: "Fish-in",
};

export const MATURITY_LABEL: Record<MediaMaturity, string> = {
  unknown: "Not sure",
  new: "New",
  maturing: "Maturing",
  established: "Established",
};

export const MEDIA_LEVEL_LABEL: Record<MediaLevel, string> = {
  minimal: "Minimal",
  standard: "Standard",
  generous: "Generous",
};

export function testAgeDays(testedOn: string | null | undefined, now = new Date()): number | null {
  if (!testedOn) return null;
  const then = new Date(`${testedOn}T00:00:00`);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((now.getTime() - then.getTime()) / 86_400_000);
}

export function isTestCurrent(testedOn: string | null | undefined, now = new Date()): boolean {
  const age = testAgeDays(testedOn, now);
  return age !== null && age >= 0 && age <= TEST_MAX_AGE_DAYS;
}

export type CycleStage = "unsafe" | "not_started" | "cycling" | "unverified" | "ready";

export interface CycleVerdict {
  stage: CycleStage;
  label: string;
  detail: string;
  action: string;
  severity: "critical" | "caution" | "good";
}

/** Reads the tank's own cycle settings against its newest test result. */
export function cycleVerdict(
  tank: Pick<TrackedTank, "cycle_status" | "filter_maturity">,
  latest: WaterTest | null,
  now = new Date(),
): CycleVerdict {
  const fresh = latest !== null && isTestCurrent(latest.tested_on, now);
  const ammonia = latest?.ammonia_mg_l ?? null;
  const nitrite = latest?.nitrite_mg_l ?? null;

  if ((ammonia !== null && ammonia > 0) || (nitrite !== null && nitrite > 0)) {
    return {
      stage: "unsafe",
      label: "Do not add fish",
      detail: `Your last test shows ammonia ${ammonia ?? "not tested"} mg/L and nitrite ${nitrite ?? "not tested"} mg/L. Both burn gills at any reading above zero.`,
      action:
        "Find the cause, do a water change to protect any fish already in there, and keep testing daily until both sit on zero.",
      severity: "critical",
    };
  }

  if (tank.cycle_status === "not_started") {
    return {
      stage: "not_started",
      label: "Cycle not started",
      detail: "There is no biofilter yet, so waste has nowhere to go.",
      action: "Start a fishless cycle, then test every day or two and log the results here.",
      severity: "critical",
    };
  }

  if (tank.cycle_status === "cycling") {
    return {
      stage: "cycling",
      label: "Still cycling",
      detail: "The filter is building bacteria. Ammonia and nitrite will spike before they settle.",
      action: "Keep testing until ammonia and nitrite both read zero on two tests in a row.",
      severity: "caution",
    };
  }

  if (!fresh || ammonia === null || nitrite === null) {
    const age = testAgeDays(latest?.tested_on ?? null, now);
    return {
      stage: "unverified",
      label: "Not confirmed yet",
      detail:
        latest === null
          ? "There are no test results logged for this tank."
          : ammonia === null || nitrite === null
            ? "Your last test is missing an ammonia or nitrite reading."
            : `Your last test is ${age} days old.`,
      action: `Log an ammonia and nitrite test from the last ${TEST_MAX_AGE_DAYS} days to confirm the filter is keeping up.`,
      severity: "caution",
    };
  }

  if (tank.filter_maturity === "new") {
    return {
      stage: "cycling",
      label: "Filter still young",
      detail: "Your readings look good, but the media is new, so the bacteria are still thin.",
      action: "Add fish slowly and keep testing weekly for the next month.",
      severity: "caution",
    };
  }

  return {
    stage: "ready",
    label: "Cycled",
    detail: "Ammonia and nitrite both read zero on a current test.",
    action: "Keep testing weekly, and test again a few days after adding any fish.",
    severity: "good",
  };
}

/** Nitrate is not a cycle signal, it is a water change signal. */
export function nitrateNote(latest: WaterTest | null): string | null {
  const nitrate = latest?.nitrate_mg_l ?? null;
  if (nitrate === null) return null;
  if (nitrate >= 80)
    return "Nitrate is very high. Do a water change now, then again in a few days.";
  if (nitrate >= 40) return "Nitrate is climbing. Change more water, or change it more often.";
  return "Nitrate is in a normal range for a stocked tank.";
}
