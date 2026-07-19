import type { TankState } from "./types";

export interface TankPreset {
  id: string;
  name: string;
  blurb: string;
  region: string;
  base: Partial<TankState>;
  /** Scientific names to try to auto-add. Matched against the species list. */
  suggested: string[];
}

export const TANK_PRESETS: TankPreset[] = [
  {
    id: "community-60l",
    name: "60 L peaceful community",
    blurb: "Classic starter: schooling tetras plus a few tidy bottom-dwellers.",
    region: "Amazon-inspired",
    base: {
      name: "60 L community",
      length_cm: 60, width_cm: 30, height_cm: 35,
      target_ph: 6.8, target_temp_c: 25,
      plant_density: "medium",
    },
    suggested: ["Paracheirodon innesi", "Corydoras aeneus"],
  },
  {
    id: "nano-shrimp-20l",
    name: "20 L cherry shrimp nano",
    blurb: "Lightly planted invert-friendly nano — no fish needed.",
    region: "Nano planted",
    base: {
      name: "20 L nano",
      length_cm: 30, width_cm: 25, height_cm: 30,
      target_ph: 7.0, target_temp_c: 23,
      plant_density: "heavy",
    },
    suggested: [],
  },
  {
    id: "malawi-180l",
    name: "180 L Lake Malawi",
    blurb: "Hard alkaline water, rockwork mounds, mbuna vibes.",
    region: "Lake Malawi rift",
    base: {
      name: "180 L Malawi",
      length_cm: 120, width_cm: 40, height_cm: 45,
      target_ph: 8.2, target_temp_c: 26,
      plant_density: "none",
    },
    suggested: ["Labidochromis caeruleus", "Pseudotropheus saulosi"],
  },
  {
    id: "se-asian-40l",
    name: "40 L SE Asian blackwater",
    blurb: "Soft acid water, tannin-stained, driftwood and leaf litter.",
    region: "Southeast Asian stream",
    base: {
      name: "40 L blackwater",
      length_cm: 50, width_cm: 30, height_cm: 30,
      target_ph: 6.2, target_temp_c: 25,
      plant_density: "light",
    },
    suggested: ["Boraras brigittae", "Trigonostigma heteromorpha"],
  },
];

export const PRESET_KEY = "fishtankr:pending-preset";
