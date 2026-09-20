import type { TankPreset } from "./presets";

export interface TankIdea extends TankPreset {
  slug: string;
  level: "Beginner" | "Intermediate";
  sizeLabel: string;
  style: string;
  summary: string;
  highlights: string[];
}

export const TANK_IDEAS: TankIdea[] = [
  {
    id: "betta-20l", slug: "20l-planted-betta", name: "20 L planted betta", blurb: "A calm, planted home for one betta.", summary: "A gentle single-fish setup with cover, low flow and plenty of resting places.", region: "Southeast Asian inspired", sizeLabel: "20 L", level: "Beginner", style: "Planted", highlights: ["One betta", "Low-flow filter", "Heavily planted"],
    base: { name: "20 L planted betta", length_cm: 45, width_cm: 25, height_cm: 25, target_ph: 6.8, target_temp_c: 26, plant_density: "heavy" }, suggested: ["Betta splendens"],
  },
  {
    id: "shrimp-40l", slug: "40l-shrimp-garden", name: "40 L shrimp garden", blurb: "A low-drama planted nano with room to grow.", summary: "A simple planted nano designed around stable water and hiding places for shrimp.", region: "Nano planted", sizeLabel: "40 L", level: "Beginner", style: "Nature", highlights: ["Cherry shrimp", "Moss and fine plants", "Gentle filtration"],
    base: { name: "40 L shrimp garden", length_cm: 45, width_cm: 30, height_cm: 30, target_ph: 7.2, target_temp_c: 23, plant_density: "heavy" }, suggested: [],
  },
  {
    id: "community-60l", slug: "60l-peaceful-community", name: "60 L peaceful community", blurb: "A classic starter with schooling fish and peaceful bottom-dwellers.", summary: "A soft-water community built around a small schooling fish and a peaceful bottom group.", region: "Amazon inspired", sizeLabel: "60 L", level: "Beginner", style: "Community", highlights: ["Small schooling fish", "Bottom-dweller group", "Medium planting"],
    base: { name: "60 L community", length_cm: 60, width_cm: 30, height_cm: 35, target_ph: 6.8, target_temp_c: 25, plant_density: "medium" }, suggested: ["Paracheirodon innesi", "Corydoras aeneus"],
  },
  {
    id: "gourami-90l", slug: "90l-honey-gourami-community", name: "90 L honey gourami community", blurb: "A relaxed planted community with a gentle centrepiece fish.", summary: "A warm, softly planted community with space for a honey gourami and peaceful shoaling companions.", region: "Southeast Asian inspired", sizeLabel: "90 L", level: "Intermediate", style: "Community", highlights: ["Honey gourami", "Warm planted layout", "Peaceful companions"],
    base: { name: "90 L honey gourami community", length_cm: 80, width_cm: 35, height_cm: 35, target_ph: 6.8, target_temp_c: 25, plant_density: "medium" }, suggested: ["Trichogaster chuna", "Trigonostigma heteromorpha", "Pangio kuhlii"],
  },
  {
    id: "angelfish-180l", slug: "180l-angelfish-display", name: "180 L angelfish display", blurb: "A tall planted display with room for adult angelfish.", summary: "A larger, tall tank concept for angelfish with a calm layout and careful companion choices.", region: "South American inspired", sizeLabel: "180 L", level: "Intermediate", style: "Showpiece", highlights: ["Tall footprint", "Angelfish focus", "Driftwood and plants"],
    base: { name: "180 L angelfish display", length_cm: 100, width_cm: 45, height_cm: 45, target_ph: 6.8, target_temp_c: 26, plant_density: "medium" }, suggested: ["Pterophyllum scalare"],
  },
  {
    id: "malawi-180l", slug: "180l-malawi-rockscape", name: "180 L Malawi rockscape", blurb: "Hard water, dramatic rockwork and mbuna character.", summary: "A rock-heavy, alkaline-water concept that needs deliberate stocking and plenty of territory.", region: "Lake Malawi", sizeLabel: "180 L", level: "Intermediate", style: "Rockscape", highlights: ["Hard alkaline water", "Rock territories", "Mbuna planning"],
    base: { name: "180 L Malawi", length_cm: 120, width_cm: 40, height_cm: 45, target_ph: 8.2, target_temp_c: 26, plant_density: "none" }, suggested: ["Labidochromis caeruleus", "Pseudotropheus saulosi"],
  },
];

export function getTankIdea(slug: string) {
  return TANK_IDEAS.find((idea) => idea.slug === slug);
}
