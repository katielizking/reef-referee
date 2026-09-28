import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "./account";
import type { TrackedTank, WaterTest } from "./cycle-status";
import { loadTankBySlug, type FullTank } from "./data";
import { scoreTank } from "./scoring";
import { scoringState, waterLitres } from "./tank-shape";
import type { TankRow, TankState } from "./types";
import { absoluteUrl } from "./site";

/**
 * One tank through its life: plan → save → track water → review changes.
 * A tracked tank points at the saved plan it came from (plan_id), so the
 * tracker keeps the plan's name, size, fish and water targets.
 */

export type LinkedTrackedTank = TrackedTank & { plan_id?: string | null };

// ---------- plan → calculator state ----------

/** Calculator state for a saved or shared plan. */
export function stateFromFullTank(data: FullTank, name = data.tank.name): TankState {
  return {
    name,
    length_cm: data.tank.length_cm,
    width_cm: data.tank.width_cm,
    height_cm: data.tank.height_cm,
    filter: data.filter,
    extra_filters: data.filters,
    maintenance_frequency: data.tank.maintenance_frequency,
    biological_media_level:
      data.tank.biological_media_level ?? data.filter?.biological_media_level ?? "standard",
    filter_maturity: data.tank.filter_maturity ?? "unknown",
    cycle_status: data.tank.cycle_status ?? "unknown",
    cycle_method: data.tank.cycle_method ?? "unknown",
    tank_age_weeks: data.tank.tank_age_weeks ?? null,
    ammonia_mg_l: data.tank.ammonia_mg_l ?? null,
    nitrite_mg_l: data.tank.nitrite_mg_l ?? null,
    nitrate_mg_l: data.tank.nitrate_mg_l ?? null,
    water_tested_on: data.tank.water_tested_on ?? null,
    seeded_media: data.tank.seeded_media ?? false,
    target_ph: data.tank.target_ph,
    target_temp_c: data.tank.target_temp_c,
    plant_density: data.tank.plant_density,
    tank_shape: data.tank.tank_shape ?? "rectangle",
    substrate: data.tank.substrate ?? "gravel",
    has_heater: data.tank.has_heater ?? true,
    has_light: data.tank.has_light ?? true,
    has_co2: data.tank.has_co2 ?? false,
    species: data.species,
    invertebrates: data.invertebrates,
    plants: data.plants,
    hardscape: data.hardscape,
  };
}

// ---------- plan → tracked tank ----------

/** The tracker record a saved plan starts as. Keeps the plan's name and volume. */
export function trackedTankFromPlan(plan: TankRow) {
  const state = {
    length_cm: plan.length_cm,
    width_cm: plan.width_cm,
    height_cm: plan.height_cm,
    tank_shape: plan.tank_shape,
  };
  return {
    name: plan.name,
    litres: Math.round(waterLitres(state)),
    tank_age_weeks: plan.tank_age_weeks ?? null,
    cycle_status: plan.cycle_status ?? "unknown",
    cycle_method: plan.cycle_method ?? "unknown",
    filter_maturity: plan.filter_maturity ?? "unknown",
    // The planner says "substantial"; the tracker stores the same level as "generous".
    biological_media_level:
      plan.biological_media_level === "substantial"
        ? ("generous" as const)
        : (plan.biological_media_level ?? "standard"),
    seeded_media: plan.seeded_media ?? false,
    plan_id: plan.id,
  };
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("You need an active session to track a tank.");
  return uid;
}

/** The tracked tank for a saved plan, if the plan is being tracked. */
export function useTrackedTankForPlan(planId: string | undefined) {
  const { user, ready } = useAccount();
  return useQuery({
    queryKey: ["tracked-tanks", "for-plan", planId, user?.id],
    enabled: ready && !!user && !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_tanks")
        .select("*")
        .eq("plan_id", planId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      // Before the plan-link migration, the column does not exist yet: nothing is linked.
      if (error) return null;
      return (data as unknown as LinkedTrackedTank | null) ?? null;
    },
  });
}

/** Start tracking a saved plan, or return the tracked tank it already has. */
export function useStartTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: TankRow): Promise<LinkedTrackedTank> => {
      const user_id = await currentUserId();
      const existing = await supabase
        .from("tracked_tanks")
        .select("*")
        .eq("plan_id", plan.id)
        .eq("user_id", user_id)
        .maybeSingle();
      if (!existing.error && existing.data) return existing.data as unknown as LinkedTrackedTank;
      const { data, error } = await supabase
        .from("tracked_tanks")
        .insert({ ...trackedTankFromPlan(plan), user_id })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as LinkedTrackedTank;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tracked-tanks"] }),
  });
}

/** The saved plan behind a tracked tank, with its fish, loaded through its share link. */
export function useLinkedPlan(planId: string | null | undefined) {
  const { user, ready } = useAccount();
  return useQuery({
    queryKey: ["tanks", "linked-plan", planId, user?.id],
    enabled: ready && !!user && !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tanks")
        .select("*")
        .eq("id", planId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as unknown as TankRow;
      const full = await loadTankBySlug(row.share_slug);
      return full ? { row, full, state: stateFromFullTank(full) } : null;
    },
  });
}

// ---------- review changes ----------

export interface ReviewNote {
  tone: "good" | "caution" | "critical";
  text: string;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, ""));

/** What moved between the two newest tests. */
export function testChanges(latest: WaterTest | null, previous: WaterTest | null): ReviewNote[] {
  if (!latest || !previous) return [];
  const notes: ReviewNote[] = [];
  const fields: Array<[keyof WaterTest, string, string, boolean]> = [
    ["ammonia_mg_l", "Ammonia", " mg/L", true],
    ["nitrite_mg_l", "Nitrite", " mg/L", true],
    ["nitrate_mg_l", "Nitrate", " mg/L", true],
    ["ph", "pH", "", false],
    ["temp_c", "Temperature", " °C", false],
  ];
  for (const [key, label, unit, lowerIsBetter] of fields) {
    const a = previous[key] as number | null;
    const b = latest[key] as number | null;
    if (a === null || b === null || a === b) continue;
    const rising = b > a;
    const tone: ReviewNote["tone"] =
      lowerIsBetter && (key === "ammonia_mg_l" || key === "nitrite_mg_l") && b > 0
        ? "critical"
        : lowerIsBetter
          ? rising
            ? "caution"
            : "good"
          : "caution";
    notes.push({
      tone,
      text: `${label} ${rising ? "rose" : "fell"} from ${fmt(a)} to ${fmt(b)}${unit} since ${previous.tested_on}.`,
    });
  }
  return notes;
}

/** How the newest reading compares with the plan's targets and its fish. */
export function planReview(plan: TankState, latest: WaterTest | null): ReviewNote[] {
  if (!latest) return [];
  const notes: ReviewNote[] = [];
  if (latest.ph !== null) {
    const outside = plan.species.filter(
      ({ species: s }) => latest.ph! < s.native_ph_min || latest.ph! > s.native_ph_max,
    );
    if (outside.length > 0) {
      notes.push({
        tone: "caution",
        text: `pH ${latest.ph} is outside the range for ${outside.map((r) => r.species.common_name).join(", ")}. The plan targets pH ${plan.target_ph.toFixed(1)}.`,
      });
    } else if (Math.abs(latest.ph - plan.target_ph) >= 0.5) {
      notes.push({
        tone: "caution",
        text: `pH ${latest.ph} is ${latest.ph > plan.target_ph ? "above" : "below"} the plan's target of ${plan.target_ph.toFixed(1)}, though still inside every fish's range.`,
      });
    } else {
      notes.push({
        tone: "good",
        text: `pH ${latest.ph} matches the plan (target ${plan.target_ph.toFixed(1)}).`,
      });
    }
  }
  if (latest.temp_c !== null) {
    const outside = plan.species.filter(
      ({ species: s }) =>
        latest.temp_c! < s.native_temp_min_c || latest.temp_c! > s.native_temp_max_c,
    );
    if (outside.length > 0) {
      notes.push({
        tone: "caution",
        text: `${latest.temp_c} °C is outside the range for ${outside.map((r) => r.species.common_name).join(", ")}. The plan targets ${plan.target_temp_c} °C.`,
      });
    } else if (Math.abs(latest.temp_c - plan.target_temp_c) >= 2) {
      notes.push({
        tone: "caution",
        text: `${latest.temp_c} °C is ${latest.temp_c > plan.target_temp_c ? "above" : "below"} the plan's target of ${plan.target_temp_c} °C, though still inside every fish's range.`,
      });
    } else {
      notes.push({
        tone: "good",
        text: `${latest.temp_c} °C matches the plan (target ${plan.target_temp_c} °C).`,
      });
    }
  }
  return notes;
}

// ---------- ask the community ----------

/** A post the user can edit before asking the community about their plan. */
export function communityDraftForPlan(full: FullTank, shareSlug: string) {
  const state = stateFromFullTank(full);
  const scorecard = scoreTank(scoringState(state));
  const litres = Math.round(waterLitres(state));
  const fish = state.species.map((r) => `- ${r.quantity} × ${r.species.common_name}`).join("\n");
  const inverts = (state.invertebrates ?? [])
    .map((r) => `- ${r.quantity} × ${r.invertebrate.common_name}`)
    .join("\n");
  const issue = scorecard.priorityAction;
  const body = [
    `Planning a ${litres} L tank (${state.length_cm} × ${state.width_cm} × ${state.height_cm} cm), pH ${state.target_ph.toFixed(1)} at ${state.target_temp_c} °C${state.filter ? `, with a ${state.filter.name}` : ""}.`,
    "",
    "Fish:",
    fish || "- none yet",
    ...(inverts ? ["", "Shrimp, snails and crabs:", inverts] : []),
    "",
    scorecard.overall === null
      ? "The calculator has no score yet."
      : `The calculator scores it ${scorecard.overall}/100${issue ? ` and flags: ${issue.title.toLowerCase()}.` : "."}`,
    "",
    "My question: ",
  ].join("\n");
  return {
    title: `Feedback on my ${litres} L plan: ${state.name}`,
    body,
    flair: "Question",
    link_url: absoluteUrl(`/t/${shareSlug}`),
  };
}

/** The share slug in a post link that points at a FishTankr plan, if any. */
export function planSlugFromLink(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const site = new URL(absoluteUrl("/"));
    if (u.host !== site.host) return null;
    const m = u.pathname.match(/^\/t\/([A-Za-z0-9_-]+)\/?$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}
