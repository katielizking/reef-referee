import type { TankState } from "./types";

export const DEFAULT_STATE: TankState = {
  name: "My tank",
  length_cm: 90,
  width_cm: 40,
  height_cm: 45,
  filter: null,
  extra_filters: [],
  maintenance_frequency: "weekly",
  biological_media_level: "standard",
  filter_maturity: "unknown",
  cycle_status: "unknown",
  cycle_method: "unknown",
  tank_age_weeks: null,
  ammonia_mg_l: null,
  nitrite_mg_l: null,
  nitrate_mg_l: null,
  water_tested_on: null,
  seeded_media: false,
  target_ph: 7.0,
  target_temp_c: 25,
  plant_density: "medium",
  species: [],
  plants: [],
  hardscape: [],
};

export const DRAFT_KEY = "fishtankr:draft:v1";
export interface TankDraft { version: 1; state: TankState; savedId?: string; source?: string }
export function parseDraft(raw: string | null): TankDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw);
    const s = draft?.state;
    if (draft.version !== 1 || !s || typeof s.name !== "string" ||
      ![s.length_cm,s.width_cm,s.height_cm,s.target_ph,s.target_temp_c].every(v => typeof v === "number" && Number.isFinite(v)) ||
      ![s.species,s.plants,s.hardscape].every(Array.isArray)) return null;
    for (const [rows, key] of [[s.species,"species"],[s.plants,"plant"],[s.hardscape,"hardscape"]] as const) {
      if (!rows.every((row: any) => row?.[key]?.id && typeof row[key].id === "string" && Number.isInteger(row.quantity) && row.quantity > 0)) return null;
    }
    return {version: 1, state: {...DEFAULT_STATE, ...s},
      savedId: typeof draft.savedId === "string" ? draft.savedId : undefined,
      source: typeof draft.source === "string" ? draft.source : undefined};
  } catch { return null; }
}
