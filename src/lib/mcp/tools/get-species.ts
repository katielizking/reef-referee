import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, getAnonSupabase, textResult } from "../supabase";

export default defineTool({
  name: "get_species",
  title: "Get species details",
  description: "Return the full care profile for a single species by id, scientific name, or common name.",
  inputSchema: {
    id: z.string().uuid().optional(),
    scientific_name: z.string().optional(),
    common_name: z.string().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input) => {
    if (!input.id && !input.scientific_name && !input.common_name) {
      return errorResult("Provide id, scientific_name, or common_name.");
    }
    const supabase = getAnonSupabase();
    let q = supabase.from("species").select("*").limit(1);
    if (input.id) q = q.eq("id", input.id);
    else if (input.scientific_name) q = q.ilike("scientific_name", input.scientific_name);
    else if (input.common_name) q = q.ilike("common_name", input.common_name);
    const { data, error } = await q.maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return errorResult("No matching species found.");
    return textResult(data);
  },
});
