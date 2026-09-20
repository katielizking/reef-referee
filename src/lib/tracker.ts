import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TrackedTank, WaterTest } from "./cycle-status";

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("You need an active session to track a tank.");
  return uid;
}

export type NewTankInput = {
  name: string;
  litres: number | null;
  tank_age_weeks: number | null;
  cycle_status: TrackedTank["cycle_status"];
  cycle_method: TrackedTank["cycle_method"];
  filter_maturity: TrackedTank["filter_maturity"];
  biological_media_level: TrackedTank["biological_media_level"];
  seeded_media: boolean;
};

export type NewTestInput = {
  tested_on: string;
  ammonia_mg_l: number | null;
  nitrite_mg_l: number | null;
  nitrate_mg_l: number | null;
  ph: number | null;
  temp_c: number | null;
  note: string | null;
};

export function useTrackedTanks() {
  return useQuery({
    queryKey: ["tracked-tanks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_tanks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TrackedTank[];
    },
  });
}

export function useTrackedTank(id: string) {
  return useQuery({
    queryKey: ["tracked-tanks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_tanks")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as TrackedTank | null) ?? null;
    },
  });
}

export function useWaterTests(tankId: string) {
  return useQuery({
    queryKey: ["water-tests", tankId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_tests")
        .select("*")
        .eq("tank_id", tankId)
        .order("tested_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WaterTest[];
    },
  });
}

export function useCreateTank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewTankInput) => {
      const user_id = await currentUserId();
      const { data, error } = await supabase
        .from("tracked_tanks")
        .insert({ ...input, user_id })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as TrackedTank;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tracked-tanks"] }),
  });
}

export function useUpdateTank(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<NewTankInput> & { notes?: string | null }) => {
      const { data, error } = await supabase
        .from("tracked_tanks")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as TrackedTank;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tracked-tanks"] });
    },
  });
}

export function useDeleteTank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tracked_tanks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tracked-tanks"] }),
  });
}

export function useLogTest(tankId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewTestInput) => {
      const user_id = await currentUserId();
      const { data, error } = await supabase
        .from("water_tests")
        .insert({ ...input, tank_id: tankId, user_id })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as WaterTest;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["water-tests", tankId] });
      void qc.invalidateQueries({ queryKey: ["tracked-tanks"] });
    },
  });
}

export function useDeleteTest(tankId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("water_tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["water-tests", tankId] }),
  });
}
