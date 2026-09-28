import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SpeciesPortrait } from "@/components/SpeciesPortrait";
import { careEvidence, NOT_VERIFIED, regionalEvidence, speciesEvidence } from "./species-evidence";
import type { Species } from "./types";

function fish(overrides: Partial<Species>): Species {
  return {
    id: "betta",
    common_name: "Betta",
    scientific_name: "Betta splendens",
    legal_status: "permitted",
    legal_import_status: "unknown",
    legal_possession_status: "check_state_rules",
    legal_confidence: "incomplete",
    legal_source_label: null,
    legal_source_url: null,
    legal_reviewed_on: null,
    legal_note: "Listed on the DAFF permitted freshwater ornamental fish list as Betta spp.",
    care_confidence: "unreviewed",
    care_source_label: null,
    care_source_url: null,
    care_reviewed_on: null,
    ...overrides,
  } as Species;
}

const sourced = {
  legal_import_status: "permitted_with_conditions",
  legal_possession_status: "generally_permitted_check_state",
  legal_confidence: "medium",
  legal_source_label: "Australian Government — permitted ornamental fish list",
  legal_source_url: "https://example.gov.au/list",
  legal_reviewed_on: "2026-08-26",
} as const;

describe("regionalEvidence", () => {
  it("says Not verified everywhere when a permitted fish has no source on record", () => {
    const r = regionalEvidence(fish({}));
    expect(r.state).toBe("not_verified");
    expect(r.badge).toBe("Australia: not verified");
    expect(r.importLabel).toBe(NOT_VERIFIED);
    expect(r.possessionLabel).toBe(NOT_VERIFIED);
    expect(r.summary).toMatch(/have not verified/);
    expect(r.summary).not.toMatch(/permitted for import/);
    // Unsourced notes are not repeated as fact.
    expect(r.note).toBeNull();
    expect(r.source).toBeNull();
  });

  it("does not trust a known status without a source link and review date", () => {
    for (const gap of [
      { legal_source_url: null },
      { legal_reviewed_on: null },
      { legal_confidence: "incomplete" as const },
      { legal_import_status: "unknown" as const },
    ]) {
      expect(regionalEvidence(fish({ ...sourced, ...gap })).state).toBe("not_verified");
    }
  });

  it("attributes every statement to the recorded source when evidence exists", () => {
    const r = regionalEvidence(fish(sourced));
    expect(r.state).toBe("checked");
    expect(r.badge).toBe("Australia: import permitted");
    expect(r.importLabel).toBe("Permitted for import with conditions");
    expect(r.summary).toMatch(
      /^According to Australian Government — permitted ornamental fish list/,
    );
    expect(r.source?.url).toBe(sourced.legal_source_url);
    expect(r.addWarning).toBeNull();
  });

  it("only warns on the add button when the sourced record says restricted", () => {
    expect(regionalEvidence(fish({ legal_status: "prohibited" })).addWarning).toBeNull();
    expect(
      regionalEvidence(
        fish({ ...sourced, legal_status: "prohibited", legal_import_status: "not_permitted" }),
      ).addWarning,
    ).toMatch(/prohibited or restricted/);
  });
});

describe("careEvidence", () => {
  it("is Not verified for unreviewed care data with no source", () => {
    const c = careEvidence(fish({}));
    expect(c.state).toBe("not_verified");
    expect(c.label).toBe(NOT_VERIFIED);
  });

  it("is Not verified when a source is linked but never reviewed", () => {
    const c = careEvidence(
      fish({ care_source_url: "https://example.org", care_confidence: "low" }),
    );
    expect(c.state).toBe("not_verified");
    expect(c.detail).toMatch(/nobody has reviewed/);
  });

  it("names the confidence when checked against a source", () => {
    const c = careEvidence(
      fish({
        care_source_url: "https://example.org",
        care_source_label: "Seriously Fish",
        care_reviewed_on: "2026-08-01",
        care_confidence: "low",
      }),
    );
    expect(c.state).toBe("checked");
    expect(c.label).toBe("Checked against a source · low confidence");
  });
});

describe("species evidence scope", () => {
  it("never verifies the photo identification", () => {
    expect(speciesEvidence(fish(sourced)).photo.label).toBe(NOT_VERIFIED);
  });

  it("does not show a blanket species verified badge on portraits", () => {
    const html = renderToString(
      <SpeciesPortrait commonName="Betta" scientificName="Betta splendens" />,
    );
    expect(html).not.toMatch(/verified/i);
  });
});
