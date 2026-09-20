import { supabase } from "@/integrations/supabase/client";

/**
 * Record a fish the catalogue does not have yet. This only queues a research
 * request. It never creates a species row, because every species needs a cited
 * source before it can affect a score.
 */
export async function submitSpeciesRequest(commonName: string, note?: string) {
  const name = commonName.trim();
  if (name.length < 2) throw new Error("Enter the fish name.");
  const { error } = await supabase.rpc("submit_species_request", {
    p_common_name: name,
    p_note: note?.trim() ?? "",
  });
  if (error) throw new Error(error.message);
}
