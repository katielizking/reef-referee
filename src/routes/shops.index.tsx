import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, MapPin } from "lucide-react";

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
        content:
          "Freshwater and marine aquarium shops, with specialties and location details.",
      },
      { property: "og:url", content: "/shops" },
    ],
    links: [{ rel: "canonical", href: "/shops" }],
  }),
  component: ShopsIndex,
});

const STATES = ["All", "NSW", "VIC", "QLD", "WA", "SA", "ACT", "NT", "TAS"];

function ShopsIndex() {
  const [stateFilter, setStateFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aquarium_shops")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Shop[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((s) => {
      if (stateFilter !== "All" && s.state !== stateFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${s.name} ${s.suburb ?? ""} ${s.specialties.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, stateFilter, search]);

  return (
    <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-10">
      <h1 className="font-display text-4xl font-bold text-foreground">
        Aquarium shop directory
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Find helpful local fish shops and specialist retailers. Coverage is currently expanding from Australia, with more regions to come.
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
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => setStateFilter(s)}
              className={
                "min-h-9 shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors " +
                (stateFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70")
              }
            >
              {s}
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
              <Link
                to="/shops/$slug"
                params={{ slug: shop.slug }}
                className="font-display text-lg font-semibold text-foreground hover:text-primary"
              >
                {shop.name}
              </Link>
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
                  href={shop.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {shop.lat && shop.lng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <MapPin className="h-3 w-3" /> Map
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Know a great LFS that's missing? We're actively adding to this list.
      </p>
    </main>
  );
}
