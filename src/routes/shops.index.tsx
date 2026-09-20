import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ExternalLink, MapPin, Search, Store, Truck } from "lucide-react";
import { recordShopOutbound } from "@/lib/commercial";
import { shopsQuery } from "@/lib/shops";
import { useLocation } from "@/lib/location";
import { LocationPicker } from "@/components/LocationPicker";
import {
  buildShopSearchUrl,
  countryName,
  deliveryLabel,
  hasShopSearch,
  isNearby,
  shipsTo,
  type ShopDirectoryEntry,
} from "@/lib/shop-search";

const title = "Independent aquarium shops, worldwide | FishTankr";
const description =
  "A free directory of independently owned aquarium shops around the world, with delivery areas for live fish and a search for the fish you are after.";

export const Route = createFileRoute("/shops/")({
  validateSearch: (search: Record<string, unknown>): { fish?: string } => ({
    fish: typeof search.fish === "string" ? search.fish : undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/shops") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/shops") }],
  }),
  component: ShopsIndex,
});

function SearchLink({ shop, fish }: { shop: ShopDirectoryEntry; fish: string }) {
  const url = buildShopSearchUrl(shop, fish);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => recordShopOutbound(shop.id, fish && hasShopSearch(shop) ? "search" : "website")}
      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
    >
      {fish && hasShopSearch(shop) ? `Search for ${fish}` : "Website"}
      <ExternalLink className="h-3 w-3" aria-hidden />
    </a>
  );
}

function ShopCard({ shop, fish }: { shop: ShopDirectoryEntry; fish: string }) {
  const place = [shop.city, shop.region].filter(Boolean).join(", ");
  return (
    <article className="border-4 border-ink bg-paper p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link
          to="/shops/$slug"
          params={{ slug: shop.slug }}
          className="font-display text-lg font-semibold text-foreground hover:underline"
        >
          {shop.name}
        </Link>
        <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {place ? `${place}, ` : ""}
          {countryName(shop.country_code)}
        </span>
      </div>
      {shop.description && <p className="mt-2 text-sm text-muted-foreground">{shop.description}</p>}
      {shop.independent_note && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Store className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {shop.independent_note}
        </p>
      )}
      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
        <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {deliveryLabel(shop)}
        {shop.shipping_note ? `. ${shop.shipping_note}` : ""}
        {shop.delivery_reviewed_on ? ` Checked ${shop.delivery_reviewed_on}.` : ""}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {shop.specialties.map((sp) => (
          <span key={sp} className="border border-rule px-2 py-0.5 text-muted-foreground">
            {sp}
          </span>
        ))}
        <SearchLink shop={shop} fish={fish} />
        {shop.lat && shop.lng && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordShopOutbound(shop.id, "map")}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <MapPin className="h-3 w-3" aria-hidden /> Map
          </a>
        )}
      </div>
    </article>
  );
}

function ShopsIndex() {
  const navigate = useNavigate({ from: "/shops/" });
  const { fish = "" } = Route.useSearch();
  const [text, setText] = useState("");
  const location = useLocation();
  const { data, isLoading } = useQuery(shopsQuery);

  const shops = data ?? [];
  const place = location.place;

  const filtered = useMemo(() => {
    if (!place) return [];
    const q = text.trim().toLowerCase();
    return shops.filter((s) => {
      if (!isNearby(s, place) && !shipsTo(s, place)) return false;
      if (q) {
        const hay = `${s.name} ${s.city ?? ""} ${s.region ?? ""} ${countryName(s.country_code)} ${s.specialties.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [shops, text, place]);

  const grouped = useMemo(() => {
    const map = new Map<string, ShopDirectoryEntry[]>();
    for (const shop of filtered) {
      const key = shop.country_code.toUpperCase();
      map.set(key, [...(map.get(key) ?? []), shop]);
    }
    return [...map.entries()].sort((a, b) => countryName(a[0]).localeCompare(countryName(b[0])));
  }, [filtered]);

  return (
    <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-10">
      <h1 className="font-display text-4xl font-bold text-foreground">Independent aquarium shops</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        A free directory of independently owned shops around the world. No chains, no paid
        placements, nobody pays to be listed.
      </p>

      <div className="mt-6 border-4 border-ink bg-paper p-4">
        <label
          htmlFor="fish-search"
          className="font-mono text-xs font-bold uppercase tracking-wide text-foreground"
        >
          Looking for a particular fish?
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="fish-search"
            type="search"
            placeholder="Try Paracheirodon innesi or bristlenose"
            defaultValue={fish}
            onChange={(e) =>
              void navigate({
                search: () => ({ fish: e.target.value || undefined }),
                replace: true,
              })
            }
            className="min-h-11 flex-1 border-2 border-ink bg-paper px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Search className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          We do not track shop stock. Each shop's link runs your search on their own website, so you
          see what they actually have today.
        </p>
      </div>

      <div className="mt-4">
        <LocationPicker location={location} shops={shops} />
      </div>

      {place && (
        <div className="mt-4">
          <label htmlFor="shop-search" className="sr-only">
            Search shop name, suburb or specialty
          </label>
          <input
            id="shop-search"
            type="search"
            placeholder="Search shop name, suburb or specialty"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-11 w-full border-2 border-ink bg-paper px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      )}

      {!place && location.ready && (
        <p className="mt-6 text-sm text-muted-foreground">
          Pick your country, state and suburb above to see the shops you can walk into and the ones
          that deliver live fish to you.
        </p>
      )}

      {place && isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading…</p>}
      {place && !isLoading && filtered.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          No shops listed for that area yet. Try a wider state or suburb setting, or{" "}
          <Link to="/contact" className="font-semibold text-primary underline">
            suggest a shop
          </Link>
          .
        </p>
      )}

      <div className="mt-8 space-y-8">
        {grouped.map(([code, list]) => (
          <section key={code}>
            <h2 className="border-b-2 border-ink pb-1 font-display text-xl font-bold text-foreground">
              {countryName(code)}{" "}
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {list.length} {list.length === 1 ? "shop" : "shops"}
              </span>
            </h2>
            <div className="mt-3 grid gap-3">
              {list.map((shop) => (
                <ShopCard key={shop.id} shop={shop} fish={fish.trim()} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 border-4 border-ink bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <p>
          <strong className="text-foreground">How this list works.</strong> We list independently
          owned shops only: single stores, family businesses and small groups, not chains or
          franchise pet superstores. A listing is not an endorsement of a shop's animal care, and no
          shop can pay to be listed or to rank higher.
        </p>
        <p className="mt-2">
          Shop missing, or a detail wrong?{" "}
          <Link to="/contact" className="font-semibold text-primary underline">
            Tell us and we will check it.
          </Link>
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-4 border-ink bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Before you buy:</strong> check the fish suits your tank
          and the fish already in it.
        </p>
        <Link
          to="/calculator"
          className="inline-flex min-h-11 shrink-0 items-center justify-center border-4 border-ink bg-ink px-4 text-sm font-semibold text-on-ink"
        >
          Check my tank
        </Link>
      </div>
    </main>
  );
}
