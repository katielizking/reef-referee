import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Search, Store, Truck } from "lucide-react";
import { shopsQuery } from "@/lib/shops";
import { recordShopOutbound } from "@/lib/commercial";
import { useLocation } from "@/lib/location";
import { LocationPicker } from "@/components/LocationPicker";
import {
  buildShopSearchUrl,
  countryName,
  fishSearchTerms,
  hasShopSearch,
  isNearby,
  shipsTo,
  type ShopDirectoryEntry,
} from "@/lib/shop-search";

type Props = {
  commonName: string;
  scientificName?: string | null;
  compact?: boolean;
};

function ShopRow({
  shop,
  term,
  kind,
}: {
  shop: ShopDirectoryEntry;
  term: string;
  kind: "near" | "delivers";
}) {
  const url = buildShopSearchUrl(shop, term);
  const place = [shop.city, shop.region].filter(Boolean).join(", ");
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-rule py-2 last:border-b-0">
      <div className="min-w-0">
        <Link
          to="/shops/$slug"
          params={{ slug: shop.slug }}
          className="font-semibold text-foreground hover:underline"
        >
          {shop.name}
        </Link>
        <span className="ml-2 font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {place || countryName(shop.country_code)}
        </span>
        {kind === "delivers" && shop.shipping_note && (
          <p className="mt-0.5 text-xs text-muted-foreground">{shop.shipping_note}</p>
        )}
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordShopOutbound(shop.id, hasShopSearch(shop) ? "search" : "website")}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {hasShopSearch(shop) ? "Search their stock" : "Open their site"}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      )}
    </li>
  );
}

export function WhereToBuy({ commonName, scientificName, compact }: Props) {
  const location = useLocation();
  const { data: shops } = useQuery(shopsQuery);
  const terms = fishSearchTerms({ common_name: commonName, scientific_name: scientificName });
  const [term, setTerm] = useState(terms[0] ?? commonName);

  const { near, delivers } = useMemo(() => {
    const all = shops ?? [];
    return {
      near: all.filter((s) => isNearby(s, location.place)),
      delivers: all.filter((s) => shipsTo(s, location.place) && !isNearby(s, location.place)),
    };
  }, [shops, location.place]);

  return (
    <section className={compact ? "" : "mt-10"}>
      <h2 className="font-display text-2xl font-bold text-foreground">Where to buy</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        We do not track shop stock. Pick your location and we will run a live search for{" "}
        {commonName} on each independent shop's own website.
      </p>

      <div className="mt-4">
        <LocationPicker location={location} shops={shops ?? []} />
      </div>

      {terms.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono uppercase tracking-wide text-muted-foreground">
            Search for
          </span>
          {terms.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTerm(t)}
              className={
                "min-h-8 border-2 border-ink px-2 font-semibold " +
                (term === t ? "bg-ink text-on-ink" : "text-foreground hover:bg-muted")
              }
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {!location.place && location.ready && (
        <p className="mt-4 text-sm text-muted-foreground">
          Choose a country to see shops you can visit and shops that deliver live fish to you.
        </p>
      )}

      {location.place && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="border-4 border-ink bg-paper p-4">
            <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wide text-foreground">
              <Store className="h-4 w-4" aria-hidden /> Shops you can visit
            </p>
            {near.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                None listed near you yet.{" "}
                <Link to="/contact" className="font-semibold text-primary underline">
                  Suggest a shop.
                </Link>
              </p>
            ) : (
              <ul className="mt-2">
                {near.map((s) => (
                  <ShopRow key={s.id} shop={s} term={term} kind="near" />
                ))}
              </ul>
            )}
          </div>
          <div className="border-4 border-ink bg-paper p-4">
            <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wide text-foreground">
              <Truck className="h-4 w-4" aria-hidden /> Delivers live fish to you
            </p>
            {delivers.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No listed shop states it delivers live fish to your area.
              </p>
            ) : (
              <ul className="mt-2">
                {delivers.map((s) => (
                  <ShopRow key={s.id} shop={s} term={term} kind="delivers" />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <Search className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Search links go straight to each shop's own site, so you always see their current stock, not
        our copy of it. Delivery details show the date we last checked them on the shop's site.
      </p>
    </section>
  );
}
