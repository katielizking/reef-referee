import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, getAnonSupabase, textResult } from "../supabase";

export default defineTool({
  name: "find_aquarium_shops",
  title: "Find Australian aquarium shops",
  description: "Find aquarium/fishkeeping shops in FishTankr's Australian directory, filterable by state or suburb.",
  inputSchema: {
    state: z.string().optional().describe("Australian state code, e.g. NSW, VIC, QLD."),
    suburb: z.string().optional().describe("Case-insensitive suburb match."),
    specialty: z.string().optional().describe("Match a specialty tag (e.g. 'planted', 'marine')."),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    const supabase = getAnonSupabase();
    let q = supabase
      .from("aquarium_shops")
      .select("id, slug, name, address, suburb, state, postcode, website, phone, specialties, description, lat, lng")
      .order("name")
      .limit(input.limit ?? 50);
    if (input.state) q = q.ilike("state", input.state);
    if (input.suburb) q = q.ilike("suburb", `%${input.suburb}%`);
    if (input.specialty) q = q.contains("specialties", [input.specialty]);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return textResult({ count: data?.length ?? 0, shops: data ?? [] });
  },
});
