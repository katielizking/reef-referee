import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSharedTank } from "./tanks.functions";
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
  const payload = await getSharedTank({ data: { slug } });
  if (!payload) return null;
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
  const uid = await currentUserId();
  if (!uid) throw new Error("You need an active session to save a tank.");

  const tankFields = {
    name: (state.name || "Untitled tank").slice(0, 120),
    length_cm: state.length_cm,
    width_cm: state.width_cm,
    height_cm: state.height_cm,
    filter_id: state.filter?.id ?? null,
    maintenance_frequency: state.maintenance_frequency,
    target_ph: state.target_ph,
    target_temp_c: state.target_temp_c,
    plant_density: state.plant_density,
    user_id: uid,
  };

  let tank: TankRow;
  if (existingId) {
    const { data, error } = await supabase
      .from("tanks")
      .update(tankFields)
      .eq("id", existingId)
      .eq("user_id", uid)
      .select("*")
      .single();
    if (error) throw error;
    tank = data as unknown as TankRow;
  } else {
    const { data, error } = await supabase.from("tanks").insert(tankFields).select("*").single();
    if (error) throw error;
    tank = data as unknown as TankRow;
  }

  // Replace join rows (RLS scopes every statement to the owner's tanks).
  await Promise.all([
    supabase.from("tank_species").delete().eq("tank_id", tank.id),
    supabase.from("tank_plants").delete().eq("tank_id", tank.id),
    supabase.from("tank_hardscape").delete().eq("tank_id", tank.id),
  ]);

  const speciesRows = state.species.map((row) => ({
    tank_id: tank.id,
    species_id: row.species.id,
    quantity: row.quantity,
  }));
  const plantRows = state.plants.map((row) => ({
    tank_id: tank.id,
    plant_id: row.plant.id,
    quantity: row.quantity,
  }));
  const hardscapeRows = state.hardscape.map((row) => ({
    tank_id: tank.id,
    hardscape_id: row.hardscape.id,
    quantity: row.quantity,
  }));

  const results = await Promise.all([
    speciesRows.length ? supabase.from("tank_species").insert(speciesRows) : null,
    plantRows.length ? supabase.from("tank_plants").insert(plantRows) : null,
    hardscapeRows.length ? supabase.from("tank_hardscape").insert(hardscapeRows) : null,
  ]);
  for (const res of results) {
    if (res?.error) throw res.error;
  }

  return tank;
}


export async function renameTank(id: string, name: string): Promise<TankRow> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tank name cannot be empty.");

  const { data, error } = await supabase
    .from("tanks")
    .update({ name: trimmed })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as TankRow;
}

export async function deleteTank(id: string): Promise<void> {
  const { error } = await supabase.from("tanks").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateTank(slug: string): Promise<TankRow> {
  const source = await loadTankBySlug(slug);
  if (!source) throw new Error("Tank not found.");

  return saveTank({
    name: `${source.tank.name} copy`,
    length_cm: source.tank.length_cm,
    width_cm: source.tank.width_cm,
    height_cm: source.tank.height_cm,
    filter: source.filter,
    maintenance_frequency: source.tank.maintenance_frequency,
    target_ph: source.tank.target_ph,
    target_temp_c: source.tank.target_temp_c,
    plant_density: source.tank.plant_density,
    species: source.species,
    plants: source.plants,
    hardscape: source.hardscape,
  });
}
