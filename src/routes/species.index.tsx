import { createFileRoute, Link } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useSpecies } from "@/lib/data";
import { SpeciesPortrait } from "@/components/SpeciesPortrait";
import { BIOTOPE_LABEL, type BiotopeRegion, type Temperament } from "@/lib/types";

export const Route = createFileRoute("/species/")({
  head: () => ({
    meta: [
      { title: "Freshwater fish species | FishTankr" },
      {
        name: "description",
        content:
          "Browse freshwater fish care guides and filter by natural region, temperament and adult size.",
      },
      { property: "og:title", content: "Freshwater fish species | FishTankr" },
      {
        property: "og:description",
        content:
          "Practical care, habitat and behaviour notes for popular freshwater aquarium fish.",
      },
      { property: "og:url", content: absoluteUrl("/species") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/species") }],
  }),
  component: SpeciesIndex,
});

type Region = BiotopeRegion | "all";
type SizeBand = "all" | "small" | "medium" | "large";

function SpeciesIndex() {
  const { data, isLoading } = useSpecies();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<Region>("all");
  const [temperament, setTemperament] = useState<Temperament | "all">("all");
  const [size, setSize] = useState<SizeBand>("all");

  const results = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.filter((s) => {
      if (region !== "all" && s.biotope_region !== region) return false;
      if (temperament !== "all" && s.temperament !== temperament) return false;
      if (size === "small" && s.adult_size_cm >= 6) return false;
      if (size === "medium" && (s.adult_size_cm < 6 || s.adult_size_cm > 15)) return false;
      if (size === "large" && s.adult_size_cm <= 15) return false;
      if (
        term &&
        !s.common_name.toLowerCase().includes(term) &&
        !s.scientific_name.toLowerCase().includes(term)
      )
        return false;
      return true;
    });
  }, [data, q, region, temperament, size]);

  return (
    <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8 md:py-12">
      <header className="hero-grid fishtankr-panel relative overflow-hidden rounded-[1.5rem] px-5 py-8 sm:rounded-[2rem] sm:px-10 sm:py-14">
        <span className="science-label text-primary">Field guide · freshwater</span>
        <h1 className="mt-5 max-w-3xl font-display text-3xl font-bold sm:text-4xl leading-[.98] tracking-[-.045em] text-foreground sm:text-6xl">
          Check the fish,
          <br />
          before you bring them home.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Compare care needs, behaviour, habitat and regional notes before you buy.
        </p>
        <div
          className="absolute -bottom-16 -right-12 h-52 w-52 rounded-full border-[34px] border-blue/10"
          aria-hidden
        />
      </header>

      <div className="fishtankr-panel mt-5 space-y-3 rounded-[1.25rem] p-3 sm:mt-6 sm:rounded-[1.5rem] sm:p-4 md:sticky md:top-[72px] md:z-20">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            className="min-h-11 w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search common or scientific name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search species"
          />
        </div>
        <Filter
          label="Region"
          value={region}
          onChange={setRegion}
          options={[
            ["all", "All"],
            ["amazon_blackwater", BIOTOPE_LABEL.amazon_blackwater],
            ["lake_malawi", BIOTOPE_LABEL.lake_malawi],
            ["se_asian_stream", BIOTOPE_LABEL.se_asian_stream],
            ["australian_native", BIOTOPE_LABEL.australian_native],
            ["unmapped", BIOTOPE_LABEL.unmapped],
          ]}
        />
        <Filter
          label="Temperament"
          value={temperament}
          onChange={setTemperament}
          options={[
            ["all", "All"],
            ["peaceful", "Peaceful"],
            ["semi-aggressive", "Semi-aggressive"],
            ["aggressive", "Aggressive"],
          ]}
        />
        <Filter
          label="Adult size"
          value={size}
          onChange={setSize}
          options={[
            ["all", "Any"],
            ["small", "< 6 cm"],
            ["medium", "6–15 cm"],
            ["large", "> 15 cm"],
          ]}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <p className="mt-8 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No fish match those filters. Try clearing one.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:mt-7 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((s) => (
            <li key={s.id}>
              <Link
                to="/species/$id"
                params={{ id: s.id }}
                className="depth-card group block h-full overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] border bg-card transition hover:border-primary/60"
              >
                <SpeciesPortrait
                  commonName={s.common_name}
                  scientificName={s.scientific_name}
                  compact
                  className="aspect-[4/3] border-b border-foreground/10"
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-foreground">{s.common_name}</p>
                      <p className="truncate text-xs italic text-muted-foreground">
                        {s.scientific_name}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {BIOTOPE_LABEL[s.biotope_region]}
                  </p>
                  <p className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-1">{s.adult_size_cm} cm</span>
                    <span className="rounded-full bg-muted px-2 py-1">{s.temperament}</span>
                    <span className="rounded-full bg-muted px-2 py-1">
                      min {s.min_tank_litres} L
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Filter<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<[T, string]>;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex snap-x gap-1.5 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
        {options.map(([key, lbl]) => (
          <button
            key={key}
            type="button"
            aria-pressed={value === key}
            onClick={() => onChange(key)}
            className={`min-h-11 shrink-0 snap-start rounded-full border px-3 py-1 text-xs transition ${
              value === key
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}
