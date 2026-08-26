import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useSpecies } from "@/lib/data";
import { SpeciesPortrait } from "@/components/SpeciesPortrait";
import { BIOTOPE_LABEL, type BiotopeRegion, type Temperament } from "@/lib/types";

export const Route = createFileRoute("/species/")({
  head: () => ({
    meta: [
      { title: "Freshwater fish species — FishTankr" },
      {
        name: "description",
        content:
          "Browse freshwater aquarium species with care parameters, biotope and Australian legality. Filter by region, temperament and adult size.",
      },
      { property: "og:title", content: "Freshwater fish species — FishTankr" },
      { property: "og:description", content: "Care parameters, biotope and Australian legality for popular freshwater aquarium species." },
      { property: "og:url", content: "/species" },
    ],
    links: [{ rel: "canonical", href: "/species" }],
  }),
  component: SpeciesIndex,
});

type Region = BiotopeRegion | "all";
type Legal = "all" | "permitted" | "native" | "prohibited";
type SizeBand = "all" | "small" | "medium" | "large";

function SpeciesIndex() {
  const { data, isLoading } = useSpecies();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<Region>("all");
  const [legal, setLegal] = useState<Legal>("all");
  const [temperament, setTemperament] = useState<Temperament | "all">("all");
  const [size, setSize] = useState<SizeBand>("all");

  const results = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.filter((s) => {
      if (region !== "all" && s.biotope_region !== region) return false;
      if (legal !== "all" && s.legal_status !== legal) return false;
      if (temperament !== "all" && s.temperament !== temperament) return false;
      if (size === "small" && s.adult_size_cm >= 6) return false;
      if (size === "medium" && (s.adult_size_cm < 6 || s.adult_size_cm > 15)) return false;
      if (size === "large" && s.adult_size_cm <= 15) return false;
      if (term && !s.common_name.toLowerCase().includes(term) && !s.scientific_name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [data, q, region, legal, temperament, size]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <header className="hero-grid fishtankr-panel relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <span className="science-label text-primary">Field guide · freshwater</span>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[.98] tracking-[-.045em] text-ink sm:text-6xl">
          Meet the fish,<br />before you bring them home.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Explore {data?.length ?? 0} species through real, research-grade observations—then compare their care, behaviour, habitat and Australian legality.
        </p>
        <div className="absolute -bottom-16 -right-12 h-52 w-52 rounded-full border-[34px] border-blue/10" aria-hidden />
      </header>

      <div className="fishtankr-panel sticky top-[72px] z-20 mt-6 space-y-3 rounded-[1.5rem] p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            className="w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search common or scientific name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search species"
          />
        </div>
        <Filter label="Region" value={region} onChange={setRegion} options={[
          ["all", "All"],
          ["amazon_blackwater", BIOTOPE_LABEL.amazon_blackwater],
          ["lake_malawi", BIOTOPE_LABEL.lake_malawi],
          ["se_asian_stream", BIOTOPE_LABEL.se_asian_stream],
          ["australian_native", BIOTOPE_LABEL.australian_native],
          ["unmapped", BIOTOPE_LABEL.unmapped],
        ]} />
        <Filter label="Legality" value={legal} onChange={setLegal} options={[
          ["all", "All"],
          ["permitted", "Permitted"],
          ["native", "Native"],
          ["prohibited", "Prohibited"],
        ]} />
        <Filter label="Temperament" value={temperament} onChange={setTemperament} options={[
          ["all", "All"],
          ["peaceful", "Peaceful"],
          ["semi-aggressive", "Semi-aggressive"],
          ["aggressive", "Aggressive"],
        ]} />
        <Filter label="Adult size" value={size} onChange={setSize} options={[
          ["all", "Any"],
          ["small", "< 6 cm"],
          ["medium", "6–15 cm"],
          ["large", "> 15 cm"],
        ]} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <p className="mt-8 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No species match those filters.
        </p>
      ) : (
        <ul className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((s) => (
            <li key={s.id}>
              <Link
                to="/species/$id"
                params={{ id: s.id }}
                className="depth-card group block h-full overflow-hidden rounded-[1.5rem] border bg-card transition hover:border-primary/60"
              >
                <SpeciesPortrait
                  commonName={s.common_name}
                  scientificName={s.scientific_name}
                  compact
                  className="aspect-[4/3] border-b border-ink/10"
                />
                <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-foreground">{s.common_name}</p>
                    <p className="truncate text-xs italic text-muted-foreground">{s.scientific_name}</p>
                  </div>
                  {s.legal_status === "prohibited" && (
                    <span className="rounded bg-coral/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-foreground">Prohibited</span>
                  )}
                  {s.legal_status === "native" && (
                    <span className="rounded bg-lime/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-foreground">Native</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{BIOTOPE_LABEL[s.biotope_region]}</p>
                <p className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-1">{s.adult_size_cm} cm</span>
                  <span className="rounded-full bg-muted px-2 py-1">{s.temperament}</span>
                  <span className="rounded-full bg-muted px-2 py-1">min {s.min_tank_litres} L</span>
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
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([key, lbl]) => (
          <button
            key={key}
            type="button"
            aria-pressed={value === key}
            onClick={() => onChange(key)}
            className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
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
