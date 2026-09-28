import type { Species } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

/** The URL segment for a species page: its slug, or its id until it has one. */
export function speciesParam(sp: Pick<Species, "id" | "slug">): string {
  return sp.slug || sp.id;
}

export function speciesPath(sp: Pick<Species, "id" | "slug">): string {
  return `/species/${speciesParam(sp)}`;
}
