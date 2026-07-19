import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, getAnonSupabase, textResult } from "../supabase";

export default defineTool({
  name: "recommend_filters",
  title: "Recommend filters for a tank size",
  description:
    "List filters from FishTankr's catalog, optionally sized for a given tank volume in litres. Rule of thumb: rated litres >= tank litres and turnover ~4-6x tank volume per hour.",
  inputSchema: {
    tank_litres: z.number().positive().optional().describe("Tank volume in litres to size against."),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const supabase = getAnonSupabase();
    let q = supabase.from("filters").select("*").order("rated_litres").limit(input.limit ?? 20);
    if (input.tank_litres) q = q.gte("rated_litres", input.tank_litres);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, filters: data ?? [] });
  },
});
