export type BiotopeRegion =
  | "amazon_blackwater"
  | "south_american_river"
  | "central_american_river"
  | "lake_malawi"
  | "lake_tanganyika"
  | "se_asian_stream"
  | "south_asian_river"
  | "east_asian_stream"
  | "congo_basin"
  | "west_african_stream"
  | "australian_native"
  | "north_american_freshwater"
  | "european_freshwater"
  | "unmapped";

export type SwimZone = "top" | "mid" | "bottom";
export type Temperament = "peaceful" | "semi-aggressive" | "aggressive";
export type MaintenanceFrequency = "weekly" | "fortnightly" | "monthly";
export type PlantDensity = "none" | "light" | "medium" | "heavy";
export type FilterType =
  "sponge" | "hang_on_back" | "internal" | "canister" | "sump" | "undergravel" | "other";
export type BiologicalMediaLevel = "minimal" | "standard" | "substantial";
export type FilterMaturity = "new" | "maturing" | "established" | "unknown";
export type CycleStatus = "not_started" | "cycling" | "verified" | "unknown";
export type CycleMethod = "fishless" | "fish_in" | "unknown";

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
  legal_status: "permitted" | "native" | "not_importable" | "prohibited";
  legal_note: string | null;
  legal_import_status:
    "permitted_with_conditions" | "not_permitted" | "not_applicable_native" | "unknown";
  legal_possession_status:
    | "generally_permitted_check_state"
    | "check_state_permits"
    | "prohibited_or_restricted"
    | "check_state_rules";
  legal_source_label: string | null;
  legal_source_url: string | null;
  legal_reviewed_on: string | null;
  legal_confidence: "verified" | "medium" | "incomplete";
  care_source_label?: string | null;
  care_source_url?: string | null;
  care_reviewed_on?: string | null;
  care_confidence?: "unreviewed" | "low" | "medium" | "high";
  conspecific_strategy?:
    "unreviewed" | "solitary" | "pair" | "harem" | "shoal" | "colony" | "territorial";
  conspecific_sex_ratio_note?: string | null;
  conspecific_notes?: string | null;
}

export type InvertGroup = "shrimp" | "snail" | "crayfish" | "crab";

/** Shrimp, snails, crayfish and freshwater crabs. Kept separate from fish:
 * their care rules, risks and bioload behave differently. */
export interface Invertebrate {
  id: string;
  common_name: string;
  scientific_name: string;
  invert_group: InvertGroup;
  min_tank_litres: number;
  adult_size_cm: number;
  bioload_factor: number;
  temperament: Temperament;
  min_group_size: number;
  predatory: boolean;
  fish_risk_note: string | null;
  /** Semi-terrestrial species that will drown in a full tank of water. */
  needs_land?: boolean;
  /** Local reference material only, never scored. */
  legal_status?: string;
  legal_note?: string | null;
  native_ph_min: number;
  native_ph_max: number;
  native_temp_min_c: number;
  native_temp_max_c: number;
  biotope_region: BiotopeRegion;
  algae_role: string | null;
  care_notes: string | null;
  care_source_label: string | null;
  care_source_url: string | null;
  care_reviewed_on: string | null;
  care_confidence: "unreviewed" | "low" | "medium" | "high";
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
  /** Flow and biological filtration are separate. These catalogue fields describe
   * the filter body; the builder records the media and maturity actually in use. */
  filter_type: FilterType;
  biological_media_level: BiologicalMediaLevel;
}

/** Tank outline. Dimensions are always the bounding box of the glass. */
export type TankShape = "rectangle" | "cube" | "bowfront" | "corner" | "column";

export type Substrate = "bare" | "sand" | "fine_gravel" | "gravel" | "planted_soil";

export const TANK_SHAPE_LABEL: Record<TankShape, string> = {
  rectangle: "Rectangle",
  cube: "Cube",
  bowfront: "Bowfront",
  corner: "Corner",
  column: "Column",
};

export const SUBSTRATE_LABEL: Record<Substrate, string> = {
  bare: "Bare glass",
  sand: "Sand",
  fine_gravel: "Fine gravel",
  gravel: "Gravel",
  planted_soil: "Planted soil",
};

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
  biological_media_level: BiologicalMediaLevel;
  filter_maturity: FilterMaturity;
  cycle_status: CycleStatus;
  cycle_method: CycleMethod;
  tank_age_weeks: number | null;
  ammonia_mg_l: number | null;
  nitrite_mg_l: number | null;
  nitrate_mg_l: number | null;
  water_tested_on: string | null;
  seeded_media: boolean;
  target_ph: number;
  target_temp_c: number;
  plant_density: PlantDensity;
  tank_shape: TankShape;
  substrate: Substrate;
  has_heater: boolean;
  has_light: boolean;
  has_co2: boolean;
  created_at: string;
}

/** One filter running on a tank, with the media actually in it. */
export interface TankFilterSlot {
  filter: Filter;
  biological_media_level: BiologicalMediaLevel;
  filter_maturity: FilterMaturity;
}

/** In-progress tank state held in the builder. */
export interface TankState {
  name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  /** The main filter. Its media is described by the two fields below. */
  filter: Filter | null;
  /** Any further filters running on the same tank, each with its own media. */
  extra_filters?: TankFilterSlot[];
  maintenance_frequency: MaintenanceFrequency;
  biological_media_level: BiologicalMediaLevel;
  filter_maturity: FilterMaturity;
  cycle_status: CycleStatus;
  cycle_method: CycleMethod;
  tank_age_weeks: number | null;
  ammonia_mg_l: number | null;
  nitrite_mg_l: number | null;
  nitrate_mg_l: number | null;
  water_tested_on: string | null;
  seeded_media: boolean;
  target_ph: number;
  target_temp_c: number;
  plant_density: PlantDensity;
  /** Shape of the glass. Dimensions stay the bounding box; water volume is derived. */
  tank_shape?: TankShape;
  substrate?: Substrate;
  has_heater?: boolean;
  has_light?: boolean;
  has_co2?: boolean;
  species: Array<{ species: Species; quantity: number }>;
  /** Shrimp, snails, crayfish and crabs. Checked separately from the fish score. */
  invertebrates?: Array<{ invertebrate: Invertebrate; quantity: number }>;
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
  south_american_river: "South American river",
  central_american_river: "Central American river",
  lake_malawi: "Lake Malawi rift",
  lake_tanganyika: "Lake Tanganyika rift",
  se_asian_stream: "Southeast Asian stream",
  south_asian_river: "South Asian river",
  east_asian_stream: "East Asian stream",
  congo_basin: "Congo Basin",
  west_african_stream: "West African stream",
  australian_native: "Australian native",
  north_american_freshwater: "North American freshwater",
  european_freshwater: "European freshwater",
  unmapped: "Other / mixed",
};

export const BIOTOPE_WATER: Record<
  BiotopeRegion,
  { ph_min: number; ph_max: number; temp_min: number; temp_max: number }
> = {
  amazon_blackwater: { ph_min: 4.5, ph_max: 6.5, temp_min: 24, temp_max: 29 },
  south_american_river: {
    ph_min: 5.5,
    ph_max: 7.5,
    temp_min: 22,
    temp_max: 29,
  },
  central_american_river: {
    ph_min: 6.5,
    ph_max: 8.2,
    temp_min: 22,
    temp_max: 29,
  },
  lake_malawi: { ph_min: 7.6, ph_max: 8.6, temp_min: 24, temp_max: 28 },
  lake_tanganyika: { ph_min: 7.8, ph_max: 9, temp_min: 24, temp_max: 28 },
  se_asian_stream: { ph_min: 5.5, ph_max: 7.5, temp_min: 22, temp_max: 28 },
  south_asian_river: { ph_min: 6, ph_max: 8, temp_min: 20, temp_max: 28 },
  east_asian_stream: { ph_min: 6, ph_max: 8, temp_min: 16, temp_max: 26 },
  congo_basin: { ph_min: 5.5, ph_max: 7.5, temp_min: 23, temp_max: 28 },
  west_african_stream: { ph_min: 5.5, ph_max: 7.5, temp_min: 23, temp_max: 28 },
  australian_native: { ph_min: 6.5, ph_max: 8.0, temp_min: 18, temp_max: 28 },
  north_american_freshwater: {
    ph_min: 6,
    ph_max: 8.2,
    temp_min: 10,
    temp_max: 26,
  },
  european_freshwater: { ph_min: 6.5, ph_max: 8.2, temp_min: 10, temp_max: 25 },
  unmapped: { ph_min: 6.5, ph_max: 7.5, temp_min: 22, temp_max: 27 },
};
