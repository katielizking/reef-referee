export type ShopDirectoryEntry = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  region: string | null;
  country_code: string;
  website: string | null;
  specialties: string[];
  description: string | null;
  ownership: string;
  independent_note: string | null;
  sells_online: boolean;
  ships_live_fish: boolean;
  pickup_only: boolean;
  ships_to_countries: string[];
  ships_to_regions: string[];
  shipping_note: string | null;
  delivery_reviewed_on: string | null;
  search_url_template: string | null;
  lat: number | null;
  lng: number | null;
};

export type Place = { country: string; region: string | null };

/**
 * Build the URL that searches a shop's own website for a fish.
 * We never claim a shop has stock; the link runs their live search.
 * Returns null when we have no website at all.
 */
export function buildShopSearchUrl(
  shop: Pick<ShopDirectoryEntry, "website" | "search_url_template">,
  query: string,
): string | null {
  const term = query.trim();
  if (!term) return shop.website ?? null;
  const template = shop.search_url_template;
  if (template && template.includes("{q}")) {
    return template.replace("{q}", encodeURIComponent(term));
  }
  return shop.website ?? null;
}

/** True when the link goes to a real search rather than just the shop's home page. */
export function hasShopSearch(shop: Pick<ShopDirectoryEntry, "search_url_template">): boolean {
  return Boolean(shop.search_url_template && shop.search_url_template.includes("{q}"));
}

/** Prefer the scientific name: shop catalogues index it more reliably than common names. */
export function fishSearchTerms(fish: {
  common_name: string;
  scientific_name?: string | null;
}): string[] {
  const terms = [fish.scientific_name?.trim(), fish.common_name.trim()].filter(
    (t): t is string => Boolean(t),
  );
  return [...new Set(terms)];
}

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

/** A shop you can walk into: same country, and same region when we know the region. */
export function isNearby(shop: ShopDirectoryEntry, place: Place | null): boolean {
  if (!place) return false;
  if (norm(shop.country_code) !== norm(place.country)) return false;
  if (!place.region || !shop.region) return true;
  return norm(shop.region) === norm(place.region);
}

/**
 * Does this shop deliver live fish to the given place?
 * `ships_to_regions` is treated as an allow list only when it is populated,
 * so an empty list means "the whole country they list".
 */
export function shipsTo(shop: ShopDirectoryEntry, place: Place | null): boolean {
  if (!place) return false;
  if (!shop.ships_live_fish || shop.pickup_only) return false;
  const countries = shop.ships_to_countries.map(norm);
  if (countries.length > 0 && !countries.includes(norm(place.country))) return false;
  if (countries.length === 0 && norm(shop.country_code) !== norm(place.country)) return false;
  const regions = shop.ships_to_regions.map(norm);
  if (regions.length === 0) return true;
  if (!place.region) return true;
  return regions.includes(norm(place.region));
}

export function deliveryLabel(shop: ShopDirectoryEntry): string {
  if (shop.pickup_only || !shop.sells_online) return "In store only";
  if (!shop.ships_live_fish) return "Ships dry goods only";
  const countries = shop.ships_to_countries;
  if (countries.length === 0) return "Ships live fish";
  if (countries.length === 1) return `Ships live fish within ${countries[0]}`;
  return `Ships live fish to ${countries.join(", ")}`;
}

export function countryName(code: string): string {
  const names: Record<string, string> = {
    AU: "Australia",
    CA: "Canada",
    DE: "Germany",
    NL: "Netherlands",
    NZ: "New Zealand",
    SG: "Singapore",
    GB: "United Kingdom",
    UK: "United Kingdom",
    US: "United States",
  };
  return names[norm(code)] ?? code;
}
