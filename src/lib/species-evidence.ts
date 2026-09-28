import type { Species } from "./types";

/**
 * One evidence record per species. Every statement a species page makes about
 * what has been checked (the photo, the care data, the Australian rules) is
 * generated here, so a badge can never claim more than the record supports.
 */

export const NOT_VERIFIED = "Not verified";

export type EvidenceState = "checked" | "not_verified";

export interface EvidenceItem {
  /** What was (or was not) checked, e.g. "Care data". Never just "Species". */
  subject: string;
  state: EvidenceState;
  /** Short status for badges and table cells. */
  label: string;
  /** One sentence saying what the status rests on. */
  detail: string;
}

/**
 * Photos come from captive iNaturalist observations. iNaturalist grades every
 * captive record "casual", which means the community identification is never
 * confirmed, so the photo is never presented as a verified identification.
 */
export const PHOTO_EVIDENCE: EvidenceItem = {
  subject: "Photo identification",
  state: "not_verified",
  label: NOT_VERIFIED,
  detail:
    "Photos are captive iNaturalist records. iNaturalist does not confirm the identification of captive records, so the fish shown may not be this exact species.",
};

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString();
}

export function careEvidence(s: Species): EvidenceItem {
  const confidence = s.care_confidence ?? "unreviewed";
  if (s.care_source_url && s.care_reviewed_on && confidence !== "unreviewed") {
    return {
      subject: "Care data",
      state: "checked",
      label: `Checked against a source · ${confidence} confidence`,
      detail: `Compared with ${s.care_source_label ?? "a linked care source"} on ${formatDate(s.care_reviewed_on)}.`,
    };
  }
  return {
    subject: "Care data",
    state: "not_verified",
    label: NOT_VERIFIED,
    detail: s.care_source_url
      ? "A care source is linked, but nobody has reviewed these figures against it yet."
      : "We have not linked a care source to this profile yet. Check another reputable source before adding this fish to your tank.",
  };
}

export type RegionalKind = "import_permitted" | "local_stock_only" | "restricted" | "native";

export interface RegionalEvidence extends EvidenceItem {
  /** Null whenever the evidence is missing. */
  kind: RegionalKind | null;
  badge: string;
  importLabel: string;
  possessionLabel: string;
  confidenceLabel: string;
  reviewedLabel: string;
  source: { label: string; url: string } | null;
  /** The plain-language regional statement. */
  summary: string;
  /** Our extra note, only shown when the evidence behind it is recorded. */
  note: string | null;
  /** Shown next to "Add to my tank" when the record says the fish is restricted. */
  addWarning: string | null;
}

const KIND_FROM_STATUS: Record<Species["legal_status"], RegionalKind> = {
  permitted: "import_permitted",
  not_importable: "local_stock_only",
  prohibited: "restricted",
  native: "native",
};

const BADGE: Record<RegionalKind, string> = {
  import_permitted: "Australia: import permitted",
  local_stock_only: "Australia: local stock only",
  restricted: "Australia: restricted",
  native: "Australia: native",
};

const IMPORT_LABEL: Record<Exclude<Species["legal_import_status"], "unknown">, string> = {
  permitted_with_conditions: "Permitted for import with conditions",
  not_permitted: "Not on the permitted import pathway",
  not_applicable_native: "Not applicable. Australian native.",
};

const POSSESSION_LABEL: Record<Species["legal_possession_status"], string> = {
  generally_permitted_check_state: "Generally kept; check state and territory rules",
  check_state_permits: "State or territory permits may apply",
  prohibited_or_restricted: "Prohibited or restricted; check your jurisdiction",
  check_state_rules: "Check state or territory rules",
};

const CONFIDENCE_LABEL: Record<Species["legal_confidence"], string> = {
  verified: "Species entry checked against the government source",
  medium: "Government source found; species details still need review",
  incomplete: "Incomplete",
};

function summaryFor(kind: RegionalKind, sourceLabel: string, reviewed: string): string {
  const per = `According to ${sourceLabel} (checked ${reviewed}),`;
  switch (kind) {
    case "import_permitted":
      return `${per} this fish is permitted for import into Australia with conditions. State or territory rules may still apply.`;
    case "local_stock_only":
      return `${per} this fish is not on the federal permitted import list, so any sold in Australia must come from local breeding. Ask the shop where the fish came from, and check your state or territory rules.`;
    case "restricted":
      return `${per} this fish is prohibited or restricted in Australia. Those rules may not apply where you live, so check local import and keeping laws before buying.`;
    case "native":
      return `${per} this fish is native to Australia. Rules for collecting and keeping it vary by state and territory.`;
  }
}

export function regionalEvidence(s: Species): RegionalEvidence {
  const importStatus = s.legal_import_status ?? "unknown";
  const hasEvidence =
    importStatus !== "unknown" &&
    Boolean(s.legal_source_url) &&
    Boolean(s.legal_reviewed_on) &&
    s.legal_confidence !== "incomplete";

  if (!hasEvidence) {
    return {
      subject: "Australian status",
      state: "not_verified",
      label: NOT_VERIFIED,
      detail:
        "We have no government source on record for this fish's Australian import or keeping status.",
      kind: null,
      badge: `Australia: ${NOT_VERIFIED.toLowerCase()}`,
      importLabel: NOT_VERIFIED,
      possessionLabel: NOT_VERIFIED,
      confidenceLabel: "No source recorded",
      reviewedLabel: "Not reviewed",
      source: null,
      summary:
        "We have not verified this fish's Australian import or keeping status. Check the current government list and your state or territory rules before buying.",
      note: null,
      addWarning: null,
    };
  }

  const kind = KIND_FROM_STATUS[s.legal_status];
  const sourceLabel = s.legal_source_label ?? "the Australian Government source";
  const reviewed = formatDate(s.legal_reviewed_on!);
  return {
    subject: "Australian status",
    state: "checked",
    label: `Government source · checked ${reviewed}`,
    detail: `${CONFIDENCE_LABEL[s.legal_confidence]}.`,
    kind,
    badge: BADGE[kind],
    importLabel: IMPORT_LABEL[importStatus as keyof typeof IMPORT_LABEL],
    possessionLabel: POSSESSION_LABEL[s.legal_possession_status ?? "check_state_rules"],
    confidenceLabel: CONFIDENCE_LABEL[s.legal_confidence],
    reviewedLabel: reviewed,
    source: { label: sourceLabel, url: s.legal_source_url! },
    summary: summaryFor(kind, sourceLabel, reviewed),
    note: s.legal_note,
    addWarning:
      kind === "restricted"
        ? "Australian reference data lists this fish as prohibited or restricted. This does not affect the welfare score. Check the rules where you live."
        : null,
  };
}

/** Everything a species page may claim to have checked, in display order. */
export function speciesEvidence(s: Species) {
  return {
    photo: PHOTO_EVIDENCE,
    care: careEvidence(s),
    regional: regionalEvidence(s),
  };
}
