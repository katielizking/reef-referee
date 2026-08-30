import type { BiotopeRegion, Hardscape, Species, TankState } from "@/lib/types";

const BIOTOPE_HUE: Record<BiotopeRegion, number> = {
  amazon_blackwater: 20, // warm oranges / reds (tetras, discus)
  south_american_river: 28,
  central_american_river: 55,
  lake_malawi: 210, // electric blues / yellows
  lake_tanganyika: 225,
  se_asian_stream: 350, // reds / pinks (barbs, bettas)
  south_asian_river: 330,
  east_asian_stream: 175,
  congo_basin: 265,
  west_african_stream: 290,
  australian_native: 45, // gold / bronze (rainbowfish)
  north_american_freshwater: 145,
  european_freshwater: 165,
  unmapped: 190,
};

/** Deterministic 0..1 pseudo-random from a string id. */
export function hash01(id: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function hashRange(id: string, salt: number, min: number, max: number): number {
  return min + hash01(id, salt) * (max - min);
}

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Fish colour: biotope hue with a per-species nudge so neighbours differ. */
export function speciesColour(species: Species): string {
  const baseHue = BIOTOPE_HUE[species.biotope_region] ?? 190;
  const jitter = (hash01(species.id, 7) - 0.5) * 60;
  const hue = (baseHue + jitter + 360) % 360;
  const sat = 0.55 + hash01(species.id, 13) * 0.25;
  const light = 0.5 + hash01(species.id, 23) * 0.1;
  return hslToHex(hue, sat, light);
}

export function substrateColour(state: TankState): string {
  const sub = state.hardscape.find((h) => h.hardscape.type === "substrate");
  if (!sub) return "#B9A278"; // neutral sand default
  const name = sub.hardscape.name.toLowerCase();
  if (name.includes("black")) return "#2D2A26";
  if (name.includes("gravel")) return "#7C6E58";
  if (name.includes("soil") || name.includes("aqua")) return "#3E2D1F";
  if (name.includes("sand")) return "#D9C79A";
  return "#9B8560";
}

export function hardscapeColour(item: Hardscape): string {
  switch (item.type) {
    case "wood":
      return "#6B4B2E";
    case "leaf_litter":
      return "#8A5A2A";
    case "rock":
      return "#5F6870";
    default:
      return "#8B7B5C";
  }
}
