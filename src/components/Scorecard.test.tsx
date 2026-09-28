import { renderToString } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { scoreTank } from "@/lib/scoring";
import { DEFAULT_STATE } from "@/lib/tank-draft";
import type { Species, TankState } from "@/lib/types";
import { ScorecardPanel } from "./Scorecard";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children?: ReactNode }) => <a>{children}</a>,
}));

const text = (state: TankState) =>
  renderToString(<ScorecardPanel scorecard={scoreTank(state)} state={state} />)
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

const tetra = {
  id: "tetra",
  common_name: "Neon tetra",
  scientific_name: "Paracheirodon innesi",
  min_tank_litres: 40,
  adult_size_cm: 3,
  bioload_factor: 0.5,
  swim_zone: "mid",
  temperament: "peaceful",
  is_schooling: true,
  min_group_size: 6,
  fin_nipper: false,
  predatory: false,
  long_finned: false,
  active: true,
  native_ph_min: 5,
  native_ph_max: 7.5,
  native_temp_min_c: 20,
  native_temp_max_c: 26,
  biotope_region: "amazon_blackwater",
  native_habitat_type: "still_blackwater",
} as Species;

describe("ScorecardPanel", () => {
  it("marks every check as not assessed until fish are added", () => {
    const out = text(DEFAULT_STATE);
    expect(out).toMatch(/No score yet/);
    expect(out.match(/Not assessed/g)).toHaveLength(5);
    expect(out).not.toMatch(/\d+ ?\/100/);
    expect(out).not.toMatch(/\bLow\b/);
  });

  it("shows sub-scores once fish are in the tank", () => {
    const out = text({ ...DEFAULT_STATE, species: [{ species: tetra, quantity: 8 }] });
    expect(out).not.toMatch(/Not assessed/);
    expect(out).toMatch(/\d+ ?\/100/);
  });
});
