import { useSyncExternalStore } from "react";

/**
 * Display units only. Everything stored, scored and shared stays in
 * centimetres and litres, so a units change can never alter a score.
 */
export type UnitSystem = "metric" | "us";

export const UNITS_KEY = "fishtankr:units:v1";

const LITRES_PER_GALLON = 3.785411784;
const CM_PER_INCH = 2.54;

export function cmToIn(cm: number) {
  return cm / CM_PER_INCH;
}
export function inToCm(inches: number) {
  return inches * CM_PER_INCH;
}
export function litresToGallons(litres: number) {
  return litres / LITRES_PER_GALLON;
}

/** Round to a sensible number of decimals for an input field. */
export function roundTo(n: number, dp: number) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export function lengthLabel(system: UnitSystem) {
  return system === "us" ? "in" : "cm";
}

export function volumeLabel(system: UnitSystem) {
  return system === "us" ? "gal" : "L";
}

/** A centimetre value shown in the user's units, without the unit suffix. */
export function displayLength(cm: number, system: UnitSystem) {
  return system === "us" ? roundTo(cmToIn(cm), 1) : roundTo(cm, 1);
}

/** Turn a number typed in the user's units back into centimetres. */
export function lengthToCm(value: number, system: UnitSystem) {
  return system === "us" ? inToCm(value) : value;
}

export function formatLength(cm: number, system: UnitSystem) {
  return `${displayLength(cm, system)} ${lengthLabel(system)}`;
}

export function formatVolume(litres: number, system: UnitSystem) {
  return system === "us"
    ? `${Math.round(litresToGallons(litres))} gal`
    : `${Math.round(litres)} L`;
}

// ---- shared preference, no provider needed ----

let current: UnitSystem = "metric";
let hydrated = false;
const listeners = new Set<() => void>();

function readStored(): UnitSystem {
  try {
    return localStorage.getItem(UNITS_KEY) === "us" ? "us" : "metric";
  } catch {
    return "metric";
  }
}

function snapshot(): UnitSystem {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    current = readStored();
  }
  return current;
}

export function setUnitSystem(next: UnitSystem) {
  hydrated = true;
  current = next;
  try {
    localStorage.setItem(UNITS_KEY, next);
  } catch {
    /* preference is optional */
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Current display units. Server render and first paint are always metric. */
export function useUnitSystem(): [UnitSystem, (next: UnitSystem) => void] {
  const system = useSyncExternalStore(
    subscribe,
    snapshot,
    () => "metric" as UnitSystem,
  );
  return [system, setUnitSystem];
}
