import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  GENERIC_NOTE_PATTERNS,
  LISTED_OWNERSHIP,
  isGenericOwnershipNote,
  ownershipStatement,
} from "./shop-search";

const MIGRATION = readFileSync(
  "supabase/migrations/20260928010000_shop_ownership_audit.sql",
  "utf8",
);

describe("shop ownership", () => {
  it("never lists chains", () => {
    expect(LISTED_OWNERSHIP).not.toContain("chain");
  });

  it.each([
    "Single independent store, not part of a chain.",
    "Not part of a chain or franchise group.",
    "Independently owned.",
    "independent shop",
    null,
    "",
  ])("treats %j as a generic note", (note) => {
    expect(isGenericOwnershipNote(note)).toBe(true);
  });

  it.each([
    "Family run business founded in 1969, stated on their own site.",
    "Their about page states an independent family-owned business established in 2012.",
    "Single Sydney store with a named owner and walk-in pickup.",
  ])("keeps %j as shop-specific evidence", (note) => {
    expect(isGenericOwnershipNote(note)).toBe(false);
  });

  it("only says independently owned with shop-specific evidence", () => {
    const note = "Family business since 1961, stated on their own site.";
    expect(ownershipStatement({ ownership: "independent", independent_note: note })).toEqual({
      confirmed: true,
      label: "Independently owned",
      detail: note,
    });
    for (const shop of [
      {
        ownership: "independent",
        independent_note: "Single independent store, not part of a chain.",
      },
      { ownership: "independent", independent_note: null },
      { ownership: "unverified", independent_note: note },
      { ownership: "chain", independent_note: note },
    ]) {
      expect(ownershipStatement(shop)).toMatchObject({
        confirmed: false,
        label: "Ownership not confirmed",
      });
    }
  });

  it("uses the same generic-note patterns as the audit migration", () => {
    for (const pattern of GENERIC_NOTE_PATTERNS) expect(MIGRATION).toContain(pattern);
  });
});
