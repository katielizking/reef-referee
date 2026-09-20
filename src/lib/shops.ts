import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ShopDirectoryEntry } from "./shop-search";

const COLUMNS =
  "id,slug,name,city,region,country_code,website,specialties,description,ownership,independent_note,sells_online,ships_live_fish,pickup_only,ships_to_countries,ships_to_regions,shipping_note,delivery_reviewed_on,search_url_template,lat,lng";

export const shopsQuery = queryOptions({
  queryKey: ["shops", "directory"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("aquarium_shops")
      .select(COLUMNS)
      .eq("ownership", "independent")
      .order("name");
    if (error) throw error;
    return (data ?? []) as unknown as ShopDirectoryEntry[];
  },
  staleTime: 10 * 60 * 1000,
});
