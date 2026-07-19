import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, getAnonSupabase, textResult } from "../supabase";

export default defineTool({
  name: "list_hardscape",
  title: "List hardscape items",
  description: "List hardscape items (rock, wood, substrate, leaf litter) available in FishTankr's catalog.",
  inputSchema: {
    type: z.enum(["rock", "wood", "substrate", "leaf_litter"]).optional(),
    biotope_region: z
      .enum(["amazon_blackwater", "lake_malawi", "se_asian_stream", "australian_native", "unmapped"])
      .optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const supabase = getAnonSupabase();
    let q = supabase.from("hardscape").select("*").order("name").limit(input.limit ?? 50);
    if (input.type) q = q.eq("type", input.type);
    if (input.biotope_region) q = q.eq("biotope_region", input.biotope_region);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, hardscape: data ?? [] });
  },
});
