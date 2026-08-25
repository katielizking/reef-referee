import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Filter, Hardscape, Plant, Species, TankRow } from "./types";

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useSpecies() {
  return useQuery({
    queryKey: ["species"],
    queryFn: async () => {
      const { data, error } = await supabase.from("species").select("*").order("common_name");
      if (error) throw error;
      return data as unknown as Species[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlants() {
  return useQuery({
    queryKey: ["plants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plants").select("*").order("common_name");
      if (error) throw error;
      return data as unknown as Plant[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHardscape() {
  return useQuery({
    queryKey: ["hardscape"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hardscape").select("*").order("name");
      if (error) throw error;
      return data as unknown as Hardscape[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFilters() {
  return useQuery({
    queryKey: ["filters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("filters").select("*").order("rated_litres");
      if (error) throw error;
      return data as unknown as Filter[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSessionTanks() {
  return useQuery({
    queryKey: ["tanks", "session"],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return [] as TankRow[];
      const { data, error } = await supabase
        .from("tanks")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as TankRow[];
    },
  });
}

export interface FullTank {
  tank: TankRow;
  filter: Filter | null;
  species: Array<{ species: Species; quantity: number }>;
  plants: Array<{ plant: Plant; quantity: number }>;
  hardscape: Array<{ hardscape: Hardscape; quantity: number }>;
}

export async function loadTankBySlug(slug: string): Promise<FullTank | null> {
  const { data, error } = await supabase.rpc("get_shared_tank", { p_slug: slug });
  if (error) throw error;
  if (!data) return null;
  const payload = data as unknown as {
    tank: TankRow;
    filter: Filter | null;
    species: Array<{ quantity: number; species: Species }>;
    plants: Array<{ quantity: number; plant: Plant }>;
    hardscape: Array<{ quantity: number; hardscape: Hardscape }>;
  };
  return {
    tank: payload.tank,
    filter: payload.filter ?? null,
    species: payload.species ?? [],
    plants: payload.plants ?? [],
    hardscape: payload.hardscape ?? [],
  };
}


export async function saveTank(
  state: import("./types").TankState,
  existingId?: string,
): Promise<TankRow> {
  const { data, error } = await supabase.rpc("save_tank_atomic", {
    p_existing_id: existingId ?? null,
    p_tank: {
      name: state.name || "Untitled tank",
      length_cm: state.length_cm,
      width_cm: state.width_cm,
      height_cm: state.height_cm,
      filter_id: state.filter?.id ?? null,
      maintenance_frequency: state.maintenance_frequency,
      target_ph: state.target_ph,
      target_temp_c: state.target_temp_c,
      plant_density: state.plant_density,
    },
    p_species: state.species.map((row) => ({
      species_id: row.species.id,
      quantity: row.quantity,
    })),
    p_plants: state.plants.map((row) => ({
      plant_id: row.plant.id,
      quantity: row.quantity,
    })),
    p_hardscape: state.hardscape.map((row) => ({
      hardscape_id: row.hardscape.id,
      quantity: row.quantity,
    })),
  });

  if (error) throw error;
  return data as unknown as TankRow;
}
