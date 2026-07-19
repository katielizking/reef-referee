import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, getAnonSupabase, textResult } from "../supabase";

export default defineTool({
  name: "list_plants",
  title: "List aquarium plants",
  description: "List freshwater aquarium plants in FishTankr's catalog, optionally filtered by biotope or light need.",
  inputSchema: {
    biotope_region: z
      .enum(["amazon_blackwater", "lake_malawi", "se_asian_stream", "australian_native", "unmapped"])
      .optional(),
    light_need: z.enum(["low", "med", "high"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const supabase = getAnonSupabase();
    let q = supabase.from("plants").select("*").order("common_name").limit(input.limit ?? 50);
    if (input.biotope_region) q = q.eq("biotope_region", input.biotope_region);
    if (input.light_need) q = q.eq("light_need", input.light_need);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, plants: data ?? [] });
  },
});
