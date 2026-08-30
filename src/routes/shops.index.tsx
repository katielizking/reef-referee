import { Link, createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, MapPin } from "lucide-react";
import { recordShopOutbound } from "@/lib/commercial";

type Shop = {
  id: string;
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  specialties: string[];
  description: string | null;
  country_code: string;
  featured: boolean;
  affiliate_url: string | null;
  is_affiliate: boolean;
};

export const Route = createFileRoute("/shops/")({
  head: () => ({
    meta: [
      { title: "Aquarium shops directory | FishTankr" },
      {
        name: "description",
        content:
          "A growing directory of freshwater and marine aquarium shops, with local specialties and contact details.",
      },
      { property: "og:title", content: "Aquarium shops directory | FishTankr" },
      {
        property: "og:description",
        content: "Freshwater and marine aquarium shops, with specialties and location details.",
      },
      { property: "og:url", content: absoluteUrl("/shops") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/shops") }],
  }),
  component: ShopsIndex,
});

function ShopsIndex() {
  const [locationFilter, setLocationFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => {
      const { data, error } = await supabase.from("aquarium_shops").select("*").order("name");
      if (error) throw error;
      return data as Shop[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data
      .filter((s) => {
        const locationKey = `${s.country_code}:${s.state ?? "All"}`;
        if (locationFilter !== "All" && locationKey !== locationFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          const hay = `${s.name} ${s.suburb ?? ""} ${s.specialties.join(" ")}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
  }, [data, locationFilter, search]);

  const locations = useMemo(() => {
    const values = new Map<string, string>();
    for (const shop of data ?? []) {
      const key = `${shop.country_code}:${shop.state ?? "All"}`;
      values.set(key, shop.state ? `${shop.state}, ${shop.country_code}` : shop.country_code);
    }
    return [
      ["All", "All regions"] as const,
      ...[...values.entries()].sort((a, b) => a[1].localeCompare(b[1])),
    ];
  }, [data]);

  return (
    <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-10">
      <h1 className="font-display text-4xl font-bold text-foreground">Aquarium shop directory</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Find specialist aquarium retailers. Australian coverage is the current starting dataset; the
        directory structure now supports shops internationally.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search by name, suburb or specialty…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-11 flex-1 rounded-xl border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
          {locations.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setLocationFilter(value)}
              className={
                "min-h-9 shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors " +
                (locationFilter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No shops match those filters.</p>
        )}
        {filtered.map((shop) => (
          <div key={shop.id} className="rounded-[1.25rem] border bg-card p-4 sm:rounded-2xl sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/shops/$slug"
                  params={{ slug: shop.slug }}
                  className="font-display text-lg font-semibold text-foreground hover:text-primary"
                >
                  {shop.name}
                </Link>
                {shop.featured && (
                  <span className="rounded-full bg-lime/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground">
                    Featured · paid placement
                  </span>
                )}
              </div>
              {shop.state && (
                <span className="text-xs text-muted-foreground">
                  {shop.suburb ? `${shop.suburb}, ` : ""}
                  {shop.state}
                </span>
              )}
            </div>
            {shop.description && (
              <p className="mt-2 text-sm text-muted-foreground">{shop.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              {shop.specialties.map((sp) => (
                <span key={sp} className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  {sp}
                </span>
              ))}
              {shop.website && (
                <a
                  href={shop.affiliate_url ?? shop.website}
                  target="_blank"
                  rel={
                    shop.is_affiliate || shop.affiliate_url
                      ? "noopener noreferrer sponsored nofollow"
                      : "noopener noreferrer"
                  }
                  onClick={() =>
                    recordShopOutbound(
                      shop.id,
                      shop.is_affiliate || shop.affiliate_url ? "affiliate" : "website",
                    )
                  }
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Website
                  {shop.is_affiliate || shop.affiliate_url ? " · affiliate" : ""}{" "}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {shop.lat && shop.lng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordShopOutbound(shop.id, "map")}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <MapPin className="h-3 w-3" /> Map
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <p>
          Featured means paid placement, not a welfare endorsement. Affiliate links may earn
          FishTankr a commission.{" "}
          <Link to="/affiliate-disclosure" className="font-semibold text-primary underline">
            Read the disclosure.
          </Link>
        </p>
        <p className="mt-2">
          Own one of these shops or know a missing retailer?{" "}
          <Link to="/contact" className="font-semibold text-primary underline">
            Claim, correct or suggest a listing.
          </Link>
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Before you shop:</strong> score the complete tank,
          cycle evidence and water settings.
        </p>
        <Link
          to="/"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Build a welfare-checked plan
        </Link>
      </div>
    </main>
  );
}
