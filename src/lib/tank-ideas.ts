import { DEFAULT_STATE } from "./tank-draft";
import type { Species, TankState } from "./types";

export interface TankIdea {
  slug: string;
  title: string;
  summary: string;
  style: string;
  experience: string;
  dimensions: [number, number, number];
  temperature: number;
  ph: number;
  planting: TankState["plant_density"];
  colour: string;
  stock: { name: string; scientific: string; quantity: number }[];
  layout: string;
  care: string[];
}
export const TANK_IDEAS: TankIdea[] = [
  {
    slug: "betta-shaded-garden",
    title: "A betta’s shaded garden",
    style: "Single species",
    experience: "Everyday care",
    summary: "One characterful fish, broad leaves and a quiet corner of green.",
    dimensions: [45, 30, 30],
    temperature: 26,
    ph: 7,
    planting: "heavy",
    colour: "#bd708f",
    stock: [{ name: "Betta", scientific: "Betta splendens", quantity: 1 }],
    layout:
      "Arrange broad-leaved plants around the sides and back, leaving an open route to the surface. Add a smooth resting leaf near the top and a secure lid with an air gap. Keep the centre open so the betta can patrol without pushing through dense stems.",
    care: [
      "Use a heater and a gentle filter; long fins make strong currents tiring.",
      "This template is for one betta, with no other fish. Individual temperaments vary and a small tank is not a good place to experiment with tankmates.",
      "Choose smooth decor, avoid sharp edges, and offer a varied diet in small portions.",
    ],
  },
  {
    slug: "neon-woodland",
    title: "Neons in the woodland",
    style: "Planted shoal",
    experience: "Everyday care",
    summary: "A bright ribbon of blue against dark wood and soft green planting.",
    dimensions: [75, 35, 40],
    temperature: 24,
    ph: 6.5,
    planting: "heavy",
    colour: "#4aa9e5",
    stock: [{ name: "Neon tetra", scientific: "Paracheirodon innesi", quantity: 12 }],
    layout:
      "Build two planted islands with aquarium-safe driftwood, keeping the middle and front open for swimming. A dark background and patches of shade help the shoal stand out. This is an Amazon-inspired composition rather than a strict biotope.",
    care: [
      "Introduce the shoal only after cycling and stabilising the aquarium. Acclimate carefully to your water.",
      "Check hardness as well as pH before buying; avoid trying to chase a target pH with quick chemical adjustments.",
      "The open swimming lane matters as much as the total volume. Keep it clear as plants grow.",
    ],
  },
  {
    slug: "harlequin-stream",
    title: "The harlequin stream",
    style: "Planted shoal",
    experience: "Everyday care",
    summary: "Copper-coloured rasboras moving through a softly lit planted tank.",
    dimensions: [80, 35, 40],
    temperature: 25,
    ph: 6.8,
    planting: "heavy",
    colour: "#db9c65",
    stock: [{ name: "Harlequin rasbora", scientific: "Trigonostigma heteromorpha", quantity: 12 }],
    layout:
      "Use tall plants at the back and broad leaves at each end, with an uninterrupted swimming corridor through the middle. A little floating cover can soften the light without blocking the whole surface. Choose moderate, distributed flow.",
    care: [
      "Keep the shoal together instead of splitting the space between many small groups of different fish.",
      "Trim floating plants regularly so light and gas exchange remain adequate.",
      "A stable, cycled tank and suitable source water come before decorative finishing touches.",
    ],
  },
  {
    slug: "chili-forest",
    title: "A tiny chili forest",
    style: "Small planted",
    experience: "More attention",
    summary: "Tiny red rasboras in a quiet, densely planted miniature landscape.",
    dimensions: [60, 30, 30],
    temperature: 26,
    ph: 6.3,
    planting: "heavy",
    colour: "#e3796d",
    stock: [{ name: "Chili rasbora", scientific: "Boraras brigittae", quantity: 12 }],
    layout:
      "Layer fine-leaved plants and moss around delicate branches. Keep some open water across the front, and diffuse the filter output. The miniature scale works best with small-leaved plants rather than a few large decorations.",
    care: [
      "These tiny fish need appropriately small foods; check that every fish is feeding.",
      "Use a mature, stable aquarium with suitable soft water. Small volumes can change quickly.",
      "Protect the filter intake and avoid boisterous tankmates. This design keeps the tank species-only.",
    ],
  },
  {
    slug: "white-cloud-river",
    title: "White cloud river",
    style: "Cool water",
    experience: "Everyday care",
    summary: "An open swimming lane, rounded stones and a lively cool-water shoal.",
    dimensions: [75, 35, 35],
    temperature: 20,
    ph: 7,
    planting: "medium",
    colour: "#a2c9bc",
    stock: [
      { name: "White cloud mountain minnow", scientific: "Tanichthys albonubes", quantity: 10 },
    ],
    layout:
      "Place rounded stones low along the sides, with tough plants behind them and room to swim above. Aim for good oxygenation and a secure lid. This is a river-inspired layout, not a literal fast-flow habitat replica.",
    care: [
      "Cool water does not mean uncontrolled temperature. Monitor seasonal room temperatures, especially summer heat.",
      "The target is 20 °C; assess whether your home needs heating or cooling to keep conditions stable.",
      "Keep the open water well oxygenated and do not combine this template with warm-water fish without checking overlap.",
    ],
  },
  {
    slug: "pea-puffer-jungle",
    title: "The pea puffer jungle",
    style: "Single species",
    experience: "Experienced care",
    summary: "Six tiny hunters with a maze of leaves, roots and broken sightlines.",
    dimensions: [80, 35, 35],
    temperature: 26,
    ph: 7.2,
    planting: "heavy",
    colour: "#c2c876",
    stock: [{ name: "Pea puffer", scientific: "Carinotetraodon travancoricus", quantity: 6 }],
    layout:
      "Divide the tank visually using dense plants and branching wood, with several feeding areas. Use smooth sand and gentle filtration. The aim is for a fish to move out of another’s sight, not merely hide behind a single centrepiece.",
    care: [
      "Our template follows group-care guidance: at least six, with females outnumbering males where sexable. Sources differ about solitary care; this is a deliberate group setup.",
      "A full group does not guarantee peace. Watch for persistent chasing, damaged fins or a fish missing meals, and have a separation plan.",
      "Plan suitable live or frozen foods before buying. Avoid adding snails or shrimp as decorative tankmates: puffers may eat them.",
    ],
  },
];

export function buildIdeaTank(idea: TankIdea, catalogue: Species[]): TankState {
  const species = idea.stock.map((row) => {
    const match = catalogue.find((s) => s.scientific_name === row.scientific);
    if (!match)
      throw new Error(`${row.name} is unavailable in the catalogue. Please try again later.`);
    return { species: match, quantity: row.quantity };
  });
  return {
    ...structuredClone(DEFAULT_STATE),
    name: idea.title,
    length_cm: idea.dimensions[0],
    width_cm: idea.dimensions[1],
    height_cm: idea.dimensions[2],
    target_temp_c: idea.temperature,
    target_ph: idea.ph,
    plant_density: idea.planting,
    substrate: "sand",
    species,
  };
}
