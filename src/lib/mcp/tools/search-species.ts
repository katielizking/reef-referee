import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, getAnonSupabase, textResult } from "../supabase";

export default defineTool({
  name: "search_species",
  title: "Search freshwater species",
  description:
    "Search FishTankr's freshwater species catalog. Returns common name, scientific name, adult size, tank minimum, temperament, swim zone, biotope region and Australian legal status.",
  inputSchema: {
    query: z.string().optional().describe("Case-insensitive substring match on common or scientific name."),
    biotope_region: z
      .enum(["amazon_blackwater", "lake_malawi", "se_asian_stream", "australian_native", "unmapped"])
      .optional()
      .describe("Filter to one biotope region."),
    legal_status: z
      .enum(["permitted", "native", "prohibited"])
      .optional()
      .describe("Filter by Australian legal status."),
    max_adult_size_cm: z.number().positive().optional().describe("Only species whose adult size is <= this."),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const supabase = getAnonSupabase();
    let q = supabase
      .from("species")
      .select(
        "id, common_name, scientific_name, min_tank_litres, adult_size_cm, swim_zone, temperament, is_schooling, min_group_size, biotope_region, legal_status, legal_note",
      )
      .order("common_name")
      .limit(input.limit ?? 20);

    if (input.query) {
      const like = `%${input.query}%`;
      q = q.or(`common_name.ilike.${like},scientific_name.ilike.${like}`);
    }
    if (input.biotope_region) q = q.eq("biotope_region", input.biotope_region);
    if (input.legal_status) q = q.eq("legal_status", input.legal_status);
    if (input.max_adult_size_cm) q = q.lte("adult_size_cm", input.max_adult_size_cm);

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, species: data ?? [] });
  },
});
