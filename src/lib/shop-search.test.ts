import { describe, expect, it } from "vitest";
import {
  buildShopSearchUrl,
  countryName,
  deliveryLabel,
  fishSearchTerms,
  hasShopSearch,
  isNearby,
  shipsTo,
  type ShopDirectoryEntry,
} from "./shop-search";

function shop(overrides: Partial<ShopDirectoryEntry> = {}): ShopDirectoryEntry {
  return {
    id: "1",
    slug: "test-shop",
    name: "Test Shop",
    city: "Brisbane",
    region: "QLD",
    country_code: "AU",
    website: "https://example.com",
    specialties: [],
    description: null,
    ownership: "independent",
    independent_note: null,
    sells_online: true,
    ships_live_fish: true,
    pickup_only: false,
    ships_to_countries: ["AU"],
    ships_to_regions: [],
    shipping_note: null,
    delivery_reviewed_on: "2026-09-20",
    search_url_template: "https://example.com/search?q={q}",
    lat: null,
    lng: null,
    ...overrides,
  };
}

describe("buildShopSearchUrl", () => {
  it("fills the template and encodes the term", () => {
    expect(buildShopSearchUrl(shop(), "Apistogramma agassizii")).toBe(
      "https://example.com/search?q=Apistogramma%20agassizii",
    );
  });

  it("falls back to the website when there is no template", () => {
    expect(buildShopSearchUrl(shop({ search_url_template: null }), "neon tetra")).toBe(
      "https://example.com",
    );
  });

  it("ignores a template without a placeholder", () => {
    expect(buildShopSearchUrl(shop({ search_url_template: "https://example.com/shop" }), "x")).toBe(
      "https://example.com",
    );
  });

  it("returns null when there is nothing to link to", () => {
    expect(buildShopSearchUrl({ website: null, search_url_template: null }, "x")).toBeNull();
  });

  it("reports whether a real search exists", () => {
    expect(hasShopSearch(shop())).toBe(true);
    expect(hasShopSearch(shop({ search_url_template: null }))).toBe(false);
  });
});

describe("fishSearchTerms", () => {
  it("puts the scientific name first and drops duplicates", () => {
    expect(
      fishSearchTerms({ common_name: "Neon tetra", scientific_name: "Paracheirodon innesi" }),
    ).toEqual(["Paracheirodon innesi", "Neon tetra"]);
    expect(fishSearchTerms({ common_name: "Neon tetra", scientific_name: null })).toEqual([
      "Neon tetra",
    ]);
  });
});

describe("isNearby", () => {
  it("matches country and region", () => {
    expect(isNearby(shop(), { country: "AU", region: "QLD" })).toBe(true);
    expect(isNearby(shop(), { country: "AU", region: "WA" })).toBe(false);
    expect(isNearby(shop(), { country: "NZ", region: null })).toBe(false);
  });

  it("matches the whole country when no region is chosen", () => {
    expect(isNearby(shop(), { country: "au", region: null })).toBe(true);
  });
});

describe("shipsTo", () => {
  it("covers the listed country", () => {
    expect(shipsTo(shop(), { country: "AU", region: "WA" })).toBe(true);
    expect(shipsTo(shop(), { country: "NZ", region: null })).toBe(false);
  });

  it("excludes regions the shop will not ship to", () => {
    const s = shop({ ships_to_regions: ["QLD", "NSW", "VIC"] });
    expect(shipsTo(s, { country: "AU", region: "NSW" })).toBe(true);
    expect(shipsTo(s, { country: "AU", region: "WA" })).toBe(false);
  });

  it("never claims delivery for pickup-only or dry-goods shops", () => {
    expect(shipsTo(shop({ pickup_only: true }), { country: "AU", region: "QLD" })).toBe(false);
    expect(shipsTo(shop({ ships_live_fish: false }), { country: "AU", region: "QLD" })).toBe(false);
  });
});

describe("labels", () => {
  it("describes delivery plainly", () => {
    expect(deliveryLabel(shop({ pickup_only: true }))).toBe("In store only");
    expect(deliveryLabel(shop({ ships_live_fish: false }))).toBe("Ships dry goods only");
    expect(
      deliveryLabel(shop({ ships_live_fish: false, delivery_reviewed_on: null })),
    ).toBe("Live fish delivery not confirmed");
    expect(deliveryLabel(shop())).toBe("Ships live fish within AU");
  });

  it("names countries", () => {
    expect(countryName("GB")).toBe("United Kingdom");
    expect(countryName("ZZ")).toBe("ZZ");
  });
});
