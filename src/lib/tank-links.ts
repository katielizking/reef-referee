import type { TankIdea } from "./tank-ideas";

/** "100x30x40" (cm) → [100, 30, 40]; null unless every side is 10–300 cm. */
export function parseSizeParam(value: string): [number, number, number] | null {
  const parts = value.toLowerCase().split("x").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n) || n < 10 || n > 300))
    return null;
  return parts as [number, number, number];
}

export function sizeParam(dims: [number, number, number]): string {
  return dims.join("x");
}

export function grossLitres(idea: Pick<TankIdea, "dimensions">): number {
  return Math.round(idea.dimensions.reduce((a, b) => a * b, 1) / 1000);
}
