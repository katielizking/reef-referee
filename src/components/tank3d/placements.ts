import type { TankState } from "@/lib/types";

/** Kinds of movable groups in the scene. */
export type PlacementKind = "fish" | "plant" | "hardscape" | "equipment";

/** Per-group placement override. Missing fields fall back to defaults. */
export interface PlacementOverride {
  kind: PlacementKind;
  refId: string; // species.id | plant.id | hardscape.id | "filter"
  /** Group anchor in scene units, relative to tank centre. */
  anchor: [number, number, number];
  /** Y-axis rotation in radians. */
  rotY: number;
  /** 0.5..1.6 scale multiplier for plants and hardscape. Ignored for fish. */
  scale: number;
}

export type PlacementMap = Record<string, PlacementOverride>;

export function placementKey(kind: PlacementKind, refId: string): string {
  return `${kind}:${refId}`;
}

/** Tank interior extent in scene units, matching TankScene. */
export interface Interior {
  x: number;
  y: number;
  z: number;
  substrateY: number;
}

/** Clamp an anchor so a group with the given horizontal radius stays inside the glass. */
export function clampAnchor(
  kind: PlacementKind,
  anchor: [number, number, number],
  interior: Interior,
  radius: number,
): [number, number, number] {
  const halfX = Math.max(0, interior.x / 2 - radius);
  const halfZ = Math.max(0, interior.z / 2 - radius);
  const cx = Math.max(-halfX, Math.min(halfX, anchor[0]));
  const cz = Math.max(-halfZ, Math.min(halfZ, anchor[2]));

  let cy = anchor[1];
  if (kind === "plant" || kind === "hardscape") {
    cy = interior.substrateY;
  } else if (kind === "equipment") {
    cy = 0; // filter/heater sit centred on back glass
  } else {
    // Fish: keep within usable water volume.
    const top = interior.y / 2 - 0.15;
    cy = Math.max(interior.substrateY + 0.15, Math.min(top - 0.15, cy));
  }
  return [cx, cy, cz];
}

/** Snap equipment anchor to the back glass. */
export function snapEquipmentToBack(
  anchor: [number, number, number],
  interior: Interior,
): [number, number, number] {
  const zBack = -interior.z / 2 + 0.15;
  return [anchor[0], anchor[1], zBack];
}

export const DEFAULT_ROT = 0;
export const DEFAULT_SCALE = 1;

/** Read override for a given group, or the identity default. */
export function getPlacement(
  overrides: PlacementMap | undefined,
  kind: PlacementKind,
  refId: string,
  interior: Interior,
): PlacementOverride {
  const key = placementKey(kind, refId);
  const existing = overrides?.[key];
  if (existing) return existing;
  const defaultY =
    kind === "plant" || kind === "hardscape" ? interior.substrateY : kind === "equipment" ? 0 : 0;
  return {
    kind,
    refId,
    anchor: [0, defaultY, kind === "equipment" ? -interior.z / 2 + 0.15 : 0],
    rotY: DEFAULT_ROT,
    scale: DEFAULT_SCALE,
  };
}

/** Merge a partial override into the map. */
export function setPlacement(overrides: PlacementMap, patch: PlacementOverride): PlacementMap {
  return { ...overrides, [placementKey(patch.kind, patch.refId)]: patch };
}

/** Remove a placement (e.g. when the row is deleted). */
export function removePlacement(
  overrides: PlacementMap,
  kind: PlacementKind,
  refId: string,
): PlacementMap {
  const key = placementKey(kind, refId);
  if (!(key in overrides)) return overrides;
  const { [key]: _drop, ...rest } = overrides;
  return rest;
}

/**
 * Approximate horizontal footprint of a group so clamping doesn't push it
 * through the glass. Tuned to feel snug but forgiving.
 */
export function groupFootprintRadius(
  kind: PlacementKind,
  interior: Interior,
  scale: number,
): number {
  if (kind === "fish") {
    return Math.min(interior.x, interior.z) * 0.15;
  }
  if (kind === "plant") return 0.35 * scale;
  if (kind === "hardscape") return 0.55 * scale;
  return 0.25; // equipment
}

/** Convenience: name of a placement, for the selection panel. */
export function placementLabel(state: TankState, kind: PlacementKind, refId: string): string {
  if (kind === "fish") {
    return state.species.find((s) => s.species.id === refId)?.species.common_name ?? "Fish";
  }
  if (kind === "plant") {
    return state.plants.find((p) => p.plant.id === refId)?.plant.common_name ?? "Plant";
  }
  if (kind === "hardscape") {
    return state.hardscape.find((h) => h.hardscape.id === refId)?.hardscape.name ?? "Décor";
  }
  return state.filter?.name ?? "Equipment";
}
