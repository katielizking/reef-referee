import { createFileRoute, Link } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";
import { useMemo, useState } from "react";
import { ClipboardCheck, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { useSpecies } from "@/lib/data";
import { SpeciesPortrait } from "@/components/SpeciesPortrait";
import { useTankDraft } from "@/components/TankDraftProvider";
import {
  BIOTOPE_LABEL,
  type BiotopeRegion,
  type Species,
  type SwimZone,
  type Temperament,
} from "@/lib/types";
import { requiredSwimLengthCm } from "@/lib/scoring";
import { waterLitres } from "@/lib/tank-shape";
import {
  displayLength,
  displayVolume,
  lengthLabel,
  lengthToCm,
  useUnitSystem,
  volumeLabel,
  volumeToLitres,
} from "@/lib/units";
import {
  FIT_LABEL,
  GROUP_BAND_LABEL,
  NO_FILTERS,
  SWIM_ZONE_LABEL,
  matchesFilters,
  planFit,
  type FitVerdict,
  type GroupBand,
  type LibraryFilters,
  type PlanFit,
} from "@/lib/species-fit";

export const Route = createFileRoute("/species/")({
  head: () => ({
    meta: [
      { title: "What fish can I keep? Freshwater fish library | FishTankr" },
      {
        name: "description",
        content:
          "Find freshwater fish that suit your tank: filter by tank volume and length, temperature, pH, group size and swimming level, and check each fish against your plan.",
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

/** Text fields hold what the visitor typed; an empty field means "any". */
type Inputs = { volume: string; length: string; temp: string; ph: string };
const EMPTY_INPUTS: Inputs = { volume: "", length: "", temp: "", ph: "" };

const num = (value: string): number | null => {
  const n = Number(value);
  return value.trim() === "" || !Number.isFinite(n) || n <= 0 ? null : n;
};

const FIT_STYLE: Record<FitVerdict, string> = {
  fits: "bg-lime/30 text-foreground",
  caution: "bg-warn/20 text-foreground",
  conflict: "bg-coral/20 text-foreground",
  "in-plan": "bg-primary/10 text-foreground",
};

function SpeciesIndex() {
  const { data, isLoading } = useSpecies();
  const { state: plan, hydrated } = useTankDraft();
  const [units] = useUnitSystem();
  const [q, setQ] = useState("");
  const [inputs, setInputs] = useState<Inputs>(EMPTY_INPUTS);
  const [groups, setGroups] = useState<GroupBand[]>([]);
  const [zones, setZones] = useState<SwimZone[]>([]);
  const [compare, setCompare] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [region, setRegion] = useState<Region>("all");
  const [temperament, setTemperament] = useState<Temperament | "all">("all");
  const [size, setSize] = useState<SizeBand>("all");

  const filters: LibraryFilters = useMemo(() => {
    const volume = num(inputs.volume);
    const length = num(inputs.length);
    return {
      ...NO_FILTERS,
      litres: volume === null ? null : volumeToLitres(volume, units),
      lengthCm: length === null ? null : lengthToCm(length, units),
      tempC: num(inputs.temp),
      ph: num(inputs.ph),
      groups,
      zones,
    };
  }, [inputs, groups, zones, units]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.filter((s) => {
      if (!matchesFilters(s, filters)) return false;
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
  }, [data, q, filters, region, temperament, size]);

  const fits = useMemo(() => {
    const map = new Map<string, PlanFit>();
    if (compare && hydrated) for (const s of filtered) map.set(s.id, planFit(plan, s));
    return map;
  }, [compare, hydrated, filtered, plan]);

  const conflicts = compare
    ? filtered.filter((s) => fits.get(s.id)?.verdict === "conflict").length
    : 0;
  const results =
    compare && !showConflicts
      ? filtered.filter((s) => fits.get(s.id)?.verdict !== "conflict")
      : filtered;
  const limitations = compare ? (fits.values().next().value?.limitations ?? []) : [];

  function fillFromPlan() {
    setInputs({
      volume: String(displayVolume(waterLitres(plan), units)),
      length: String(displayLength(plan.length_cm, units)),
      temp: String(plan.target_temp_c),
      ph: plan.target_ph.toFixed(1),
    });
  }

  const active =
    Object.values(inputs).some((v) => v.trim() !== "") ||
    groups.length > 0 ||
    zones.length > 0 ||
    compare ||
    region !== "all" ||
    temperament !== "all" ||
    size !== "all" ||
    q.trim() !== "";

  function clearAll() {
    setInputs(EMPTY_INPUTS);
    setGroups([]);
    setZones([]);
    setCompare(false);
    setShowConflicts(false);
    setRegion("all");
    setTemperament("all");
    setSize("all");
    setQ("");
  }

  return (
    <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8 md:py-12">
      <header className="hero-grid fishtankr-panel relative overflow-hidden rounded-[1.5rem] px-5 py-8 sm:rounded-[2rem] sm:px-10 sm:py-12">
        <span className="science-label text-primary">Fish library · freshwater</span>
        <h1 className="mt-5 max-w-3xl font-display text-3xl font-bold leading-[.98] tracking-[-.045em] text-foreground sm:text-5xl">
          What can I keep in my tank?
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Enter your tank and water, or use the plan from the calculator, to see the fish that fit.
          Then check each one against the fish you already have.
        </p>
      </header>

      <section
        aria-label="Filter by your tank"
        className="fishtankr-panel mt-5 space-y-4 rounded-[1.25rem] p-4 sm:mt-6 sm:rounded-[1.5rem] sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-foreground">Your tank</h2>
          <button
            type="button"
            onClick={fillFromPlan}
            disabled={!hydrated}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden /> Use my plan
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <NumberField
            label={`Tank volume (${volumeLabel(units)})`}
            hint="Hides fish that need more water"
            value={inputs.volume}
            onChange={(volume) => setInputs((i) => ({ ...i, volume }))}
          />
          <NumberField
            label={`Tank length (${lengthLabel(units)})`}
            hint="Hides fish that need a longer swim"
            value={inputs.length}
            onChange={(length) => setInputs((i) => ({ ...i, length }))}
          />
          <NumberField
            label="Temperature (°C)"
            hint="Keeps fish comfortable at this temperature"
            value={inputs.temp}
            onChange={(temp) => setInputs((i) => ({ ...i, temp }))}
          />
          <NumberField
            label="pH"
            step="0.1"
            hint="Keeps fish whose pH range includes this"
            value={inputs.ph}
            onChange={(ph) => setInputs((i) => ({ ...i, ph }))}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <MultiFilter
            label="Group size"
            values={groups}
            onChange={setGroups}
            options={(Object.keys(GROUP_BAND_LABEL) as GroupBand[]).map((k) => [
              k,
              GROUP_BAND_LABEL[k],
            ])}
          />
          <MultiFilter
            label="Swimming level"
            values={zones}
            onChange={setZones}
            options={(Object.keys(SWIM_ZONE_LABEL) as SwimZone[]).map((k) => [
              k,
              SWIM_ZONE_LABEL[k],
            ])}
          />
        </div>

        <div className="rounded-xl border bg-background p-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-foreground">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
              className="h-5 w-5 accent-[var(--color-teal)]"
            />
            Compare with my plan
            <span className="font-normal text-muted-foreground">
              {hydrated &&
                (plan.species.length > 0
                  ? `${plan.species.length} species in a ${Math.round(waterLitres(plan))} L tank`
                  : `${Math.round(waterLitres(plan))} L tank, no fish yet`)}
            </span>
          </label>
          {compare && (
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>
                Each fish is added to your plan at its minimum group and checked for tank-mate,
                space and water problems.{" "}
                <Link to="/calculator" className="font-semibold text-primary underline">
                  Edit my plan
                </Link>
              </p>
              {limitations.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          )}
        </div>

        <details className="group">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-foreground">
            <SlidersHorizontal className="h-4 w-4" aria-hidden /> More filters: name, region,
            temperament, adult size
          </summary>
          <div className="mt-3 space-y-3">
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
        </details>
      </section>

      {!isLoading && data && (
        <div
          className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"
          role="status"
        >
          <p>
            <span className="font-semibold text-foreground">{results.length}</span> of {data.length}{" "}
            fish match
            {compare && conflicts > 0 && (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={() => setShowConflicts((v) => !v)}
                  className="font-semibold text-primary underline"
                >
                  {showConflicts ? "Hide" : "Show"} {conflicts} that conflict with your plan
                </button>
              </>
            )}
          </p>
          {active && (
            <button
              type="button"
              onClick={clearAll}
              className="font-semibold text-primary underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <p className="mt-8 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No fish match those filters. Try clearing one.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((s) => (
            <li key={s.id}>
              <SpeciesCard species={s} fit={fits.get(s.id)} units={units} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function SpeciesCard({
  species: s,
  fit,
  units,
}: {
  species: Species;
  fit?: PlanFit;
  units: ReturnType<typeof useUnitSystem>[0];
}) {
  return (
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
        <p className="font-display font-semibold text-foreground">{s.common_name}</p>
        <p className="truncate text-xs italic text-muted-foreground">{s.scientific_name}</p>
        {fit && (
          <div className="mt-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${FIT_STYLE[fit.verdict]}`}
            >
              {FIT_LABEL[fit.verdict]}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">{fit.reasons[0]}</p>
          </div>
        )}
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Req
            label="Tank"
            value={`${displayVolume(s.min_tank_litres, units)} ${volumeLabel(units)}+`}
          />
          <Req
            label="Length"
            value={`${Math.round(displayLength(requiredSwimLengthCm(s), units))} ${lengthLabel(units)}+`}
          />
          <Req label="Temp" value={`${s.native_temp_min_c}–${s.native_temp_max_c} °C`} />
          <Req label="pH" value={`${s.native_ph_min}–${s.native_ph_max}`} />
          <Req label="Group" value={s.min_group_size > 1 ? `${s.min_group_size}+` : "1 is fine"} />
          <Req label="Swims" value={SWIM_ZONE_LABEL[s.swim_zone]} />
        </dl>
      </div>
    </Link>
  );
}

function Req({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value}
        placeholder="Any"
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
    </label>
  );
}

function MultiFilter<T extends string>({
  label,
  values,
  onChange,
  options,
}: {
  label: string;
  values: T[];
  onChange: (v: T[]) => void;
  options: Array<[T, string]>;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([key, lbl]) => {
          const on = values.includes(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? values.filter((v) => v !== key) : [...values, key])}
              className={`min-h-11 rounded-full border px-3 py-1 text-xs transition ${
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
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
