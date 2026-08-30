// Server-only helpers for shared tank reads.
// get_shared_tank is SECURITY DEFINER and is no longer executable by anon/authenticated,
// so it is invoked here with the service-role client after the slug has been validated.
import type { Filter, Hardscape, Plant, Species, TankRow } from "./types";

export interface SharedTankPayload {
  tank: TankRow;
  filter: Filter | null;
  species: Array<{ quantity: number; species: Species }>;
  plants: Array<{ quantity: number; plant: Plant }>;
  hardscape: Array<{ quantity: number; hardscape: Hardscape }>;
}

export async function fetchSharedTank(
  slug: string,
): Promise<SharedTankPayload | null> {
  const { supabaseAdmin } =
    await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("get_shared_tank", {
    p_slug: slug,
  });
  if (error) {
    console.error("[shared-tank] rpc failed", error.message);
    throw new Error("Unable to load this tank.");
  }
  return (data as unknown as SharedTankPayload | null) ?? null;
}
