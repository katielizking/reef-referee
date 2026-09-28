import type { Species } from "./types";

/**
 * Keeping look-alike species apart. Separate pages are right when the fish
 * are separate species or care-distinct varieties; what visitors need is a
 * clear signal that a similar name is a different fish.
 */

/** Other common names a fish is sold under, keyed by lower-case scientific name. */
const ALSO_KNOWN_AS: Record<string, string[]> = {
  "betta splendens": ["Siamese fighting fish"],
};

export function alsoKnownAs(sp: Pick<Species, "scientific_name">): string[] {
  return ALSO_KNOWN_AS[sp.scientific_name.trim().toLowerCase()] ?? [];
}

/** Every name a visitor might search for, lower-cased. */
export function searchableNames(sp: Pick<Species, "common_name" | "scientific_name">): string[] {
  return [sp.common_name, sp.scientific_name, ...alsoKnownAs(sp)].map((n) => n.toLowerCase());
}

const words = (name: string) => name.toLowerCase().match(/[a-z']+/g) ?? [];
const genusOf = (sp: Species) => words(sp.scientific_name)[0] ?? "";
/** Genus and species epithet, ignoring subspecies and variety names. */
const speciesKey = (sp: Species) => words(sp.scientific_name).slice(0, 2).join(" ");

/** Bred varieties of the same species, such as comet and fancy goldfish. */
export function varietiesOf(sp: Species, catalogue: Species[]): Species[] {
  return catalogue.filter((o) => o.id !== sp.id && speciesKey(o) === speciesKey(sp));
}

function containsName(outer: string[], inner: string[]): boolean {
  if (inner.length === 0 || inner.length >= outer.length) return false;
  for (let i = 0; i + inner.length <= outer.length; i++) {
    if (inner.every((w, j) => outer[i + j] === w)) return true;
  }
  return false;
}

/**
 * Different species that are easy to mistake for this one: same genus, and
 * one common name sits whole inside the other ("Betta" and "Peaceful betta").
 */
export function lookAlikesOf(sp: Species, catalogue: Species[]): Species[] {
  const mine = words(sp.common_name);
  return catalogue.filter((o) => {
    if (o.id === sp.id || genusOf(o) !== genusOf(sp) || speciesKey(o) === speciesKey(sp))
      return false;
    const theirs = words(o.common_name);
    return containsName(theirs, mine) || containsName(mine, theirs);
  });
}

/** One line a visitor can use to tell two similar fish apart. */
export function telltale(sp: Species): string {
  const temperament = sp.temperament.replace("-", " ");
  const group =
    sp.min_group_size > 1
      ? `groups of ${sp.min_group_size}+`
      : sp.temperament === "aggressive"
        ? "keep one on its own"
        : "can be kept singly";
  return `${temperament}, ${group}, ${sp.adult_size_cm} cm, needs ${sp.min_tank_litres} L+`;
}
