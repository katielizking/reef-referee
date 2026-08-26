export type BiotopeRegion =
  | "amazon_blackwater"
  | "lake_malawi"
  | "se_asian_stream"
  | "australian_native"
  | "unmapped";


export type SwimZone = "top" | "mid" | "bottom";
export type Temperament = "peaceful" | "semi-aggressive" | "aggressive";
export type MaintenanceFrequency = "weekly" | "fortnightly" | "monthly";
export type PlantDensity = "none" | "light" | "medium" | "heavy";

export interface Species {
  id: string;
  common_name: string;
  scientific_name: string;
  min_tank_litres: number;
  adult_size_cm: number;
  bioload_factor: number;
  swim_zone: SwimZone;
  temperament: Temperament;
  is_schooling: boolean;
  min_group_size: number;
  fin_nipper: boolean;
  predatory: boolean;
  long_finned: boolean;
  active: boolean;
  native_ph_min: number;
  native_ph_max: number;
  native_temp_min_c: number;
  native_temp_max_c: number;
  biotope_region: BiotopeRegion;
  native_habitat_type: string;
  legal_in_australia: boolean;
  legal_status: "permitted" | "native" | "prohibited";
  legal_note: string | null;
  legal_import_status:
    | "permitted_with_conditions"
    | "not_permitted"
    | "not_applicable_native"
    | "unknown";
  legal_possession_status:
    | "generally_permitted_check_state"
    | "check_state_permits"
    | "prohibited_or_restricted"
    | "check_state_rules";
  legal_source_label: string | null;
  legal_source_url: string | null;
  legal_reviewed_on: string | null;
  legal_confidence: "verified" | "medium" | "incomplete";
}


export interface Plant {
  id: string;
  common_name: string;
  scientific_name: string;
  biotope_region: BiotopeRegion;
  light_need: "low" | "med" | "high";
}

export interface Hardscape {
  id: string;
  name: string;
  type: "rock" | "wood" | "substrate" | "leaf_litter";
  biotope_region: BiotopeRegion;
}

export interface Filter {
  id: string;
  name: string;
  rated_litres: number;
  turnover_lph: number;
}

export interface TankRow {
  id: string;
  session_id: string;
  share_slug: string;
  name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  filter_id: string | null;
  maintenance_frequency: MaintenanceFrequency;
  target_ph: number;
  target_temp_c: number;
  plant_density: PlantDensity;
  created_at: string;
}

/** In-progress tank state held in the builder. */
export interface TankState {
  name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  filter: Filter | null;
  maintenance_frequency: MaintenanceFrequency;
  target_ph: number;
  target_temp_c: number;
  plant_density: PlantDensity;
  species: Array<{ species: Species; quantity: number }>;
  plants: Array<{ plant: Plant; quantity: number }>;
  hardscape: Array<{ hardscape: Hardscape; quantity: number }>;
  /** Per-group anchor / rotation / scale overrides, keyed as "kind:refId". */
  overrides?: Record<
    string,
    {
      kind: "fish" | "plant" | "hardscape" | "equipment";
      refId: string;
      anchor: [number, number, number];
      rotY: number;
      scale: number;
    }
  >;
}


export const BIOTOPE_LABEL: Record<BiotopeRegion, string> = {
  amazon_blackwater: "Amazon blackwater",
  lake_malawi: "Lake Malawi rift",
  se_asian_stream: "Southeast Asian stream",
  australian_native: "Australian native",
  unmapped: "Other / mixed",
};

export const BIOTOPE_WATER: Record<
  BiotopeRegion,
  { ph_min: number; ph_max: number; temp_min: number; temp_max: number }
> = {
  amazon_blackwater: { ph_min: 4.5, ph_max: 6.5, temp_min: 24, temp_max: 29 },
  lake_malawi: { ph_min: 7.6, ph_max: 8.6, temp_min: 24, temp_max: 28 },
  se_asian_stream: { ph_min: 5.5, ph_max: 7.5, temp_min: 22, temp_max: 28 },
  australian_native: { ph_min: 6.5, ph_max: 8.0, temp_min: 18, temp_max: 28 },
  unmapped: { ph_min: 6.5, ph_max: 7.5, temp_min: 22, temp_max: 27 },
};

