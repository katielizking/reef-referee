import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Search, Plus, Minus, X, Info, Fish, Sprout } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type {
  BiologicalMediaLevel,
  CycleMethod,
  CycleStatus,
  Filter,
  FilterMaturity,
  FilterType,
  Hardscape,
  MaintenanceFrequency,
  Plant,
  PlantDensity,
  Species,
  TankState,
} from "@/lib/types";
import { BIOTOPE_LABEL } from "@/lib/types";
import { litresOf } from "@/lib/scoring";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { adaptWaterToFirstSpecies } from "@/lib/defaults";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StepId } from "@/components/BuilderSteps";

interface Props {
  state: TankState;
  setState: (updater: (prev: TankState) => TankState) => void;
  species: Species[];
  plants: Plant[];
  hardscape: Hardscape[];
  filters: Filter[];
  openSteps: StepId[];
  setOpenSteps: (v: StepId[]) => void;
}

const MIN_DIM = 10;

const FILTER_TYPE_LABEL: Record<FilterType, string> = {
  sponge: "Sponge",
  hang_on_back: "Hang-on-back",
  internal: "Internal",
  canister: "Canister",
  sump: "Sump",
  undergravel: "Undergravel",
  other: "Other",
};

export function TankSetupPanel({
  state,
  setState,
  species,
  plants,
  hardscape,
  filters,
  openSteps,
  setOpenSteps,
}: Props) {
  const litres = Math.round(litresOf(state));
  const dimInvalid =
    state.length_cm < MIN_DIM || state.width_cm < MIN_DIM || state.height_cm < MIN_DIM;
  const filterUndersized = state.filter && litres > 0 && state.filter.rated_litres < litres;

  const fishCount = state.species.reduce((n, x) => n + x.quantity, 0);
  const scapeCount = state.plants.length + state.hardscape.length;

  return (
    <Accordion
      type="multiple"
      value={openSteps}
      onValueChange={(v) => setOpenSteps(v as StepId[])}
      className="space-y-2"
    >
      <AccordionItem
        value="tank"
        id="step-tank"
        className="rounded-2xl border bg-background/60 px-3 scroll-mt-20"
      >
        <AccordionTrigger className="min-h-14 py-3 hover:no-underline">
          <StepHeader
            n={1}
            title="Tank & water"
            summary={
              dimInvalid
                ? "Set each side ≥ 10 cm"
                : `${litres} L · pH ${state.target_ph.toFixed(1)} · ${state.target_temp_c}°C`
            }
          />
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-3">
          <label className="block text-sm">
            <span className="mb-1 block text-foreground/80">Name</span>
            <input
              className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={state.name}
              onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
              placeholder="Living room 60"
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <DimField
              label="Length (cm)"
              value={state.length_cm}
              onChange={(v) => setState((s) => ({ ...s, length_cm: v }))}
            />
            <DimField
              label="Width (cm)"
              value={state.width_cm}
              onChange={(v) => setState((s) => ({ ...s, width_cm: v }))}
            />
            <DimField
              label="Height (cm)"
              value={state.height_cm}
              onChange={(v) => setState((s) => ({ ...s, height_cm: v }))}
            />
          </div>
          {dimInvalid && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-coral">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              Each side needs to be at least {MIN_DIM} cm.
            </p>
          )}
          <div className="rounded-xl bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Volume</span>{" "}
            <span className="font-semibold">{litres} L</span>
          </div>
          <label className="block text-sm">
            <div className="mb-1 flex items-center justify-between text-foreground/80">
              <span>Target pH</span>
              <span className="font-medium">{state.target_ph.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={4}
              max={9}
              step={0.1}
              value={state.target_ph}
              onChange={(e) => setState((s) => ({ ...s, target_ph: Number(e.target.value) }))}
              className="w-full accent-[var(--color-teal)]"
              aria-label="Target pH"
            />
          </label>
          <label className="block text-sm">
            <div className="mb-1 flex items-center justify-between text-foreground/80">
              <span>Target temp</span>
              <span className="font-medium">{state.target_temp_c}°C</span>
            </div>
            <input
              type="range"
              min={15}
              max={32}
              step={1}
              value={state.target_temp_c}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  target_temp_c: Number(e.target.value),
                }))
              }
              className="w-full accent-[var(--color-teal)]"
              aria-label="Target temperature"
            />
          </label>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="filter"
        id="step-filter"
        className="rounded-2xl border bg-background/60 px-3"
      >
        <AccordionTrigger className="min-h-14 py-3 hover:no-underline">
          <StepHeader
            n={2}
            title="Filter, cycle & maintenance"
            summary={
              state.filter
                ? `${state.filter.name} · ${state.cycle_status.replace("_", " ")}`
                : "Pick a filter and verify the cycle"
            }
          />
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-3">
          <select
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={state.filter?.id ?? ""}
            onChange={(e) => {
              const f = filters.find((x) => x.id === e.target.value) ?? null;
              setState((s) => ({
                ...s,
                filter: f,
                biological_media_level: f?.biological_media_level ?? s.biological_media_level,
              }));
            }}
            aria-label="Filter"
          >
            <option value="">Choose a filter…</option>
            {filters.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {FILTER_TYPE_LABEL[f.filter_type]}, rated {f.rated_litres} L
              </option>
            ))}
          </select>
          {filterUndersized && (
            <p className="flex items-start gap-1.5 rounded-lg bg-warn/15 px-2.5 py-1.5 text-xs font-medium text-foreground">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" aria-hidden />
              <span>
                This filter is rated for {state.filter!.rated_litres} L but your tank is {litres} L.
                Consider a larger filter.
              </span>
            </p>
          )}
          {state.filter && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground/80">
              <p className="font-semibold text-foreground">
                {FILTER_TYPE_LABEL[state.filter.filter_type]} · {state.filter.turnover_lph} L/h flow
              </p>
              <p className="mt-1 text-muted-foreground">
                Flow tells you how quickly water moves, not how much waste the filter can process.
                Add the amount and age of its biological media below.
              </p>
            </div>
          )}
          <Segmented<BiologicalMediaLevel>
            label="Biological media"
            value={state.biological_media_level}
            options={[
              { value: "minimal", label: "Minimal" },
              { value: "standard", label: "Standard" },
              { value: "substantial", label: "Substantial" },
            ]}
            onChange={(v) => setState((s) => ({ ...s, biological_media_level: v }))}
          />
          <Segmented<FilterMaturity>
            label="Filter-media maturity"
            value={state.filter_maturity}
            options={[
              { value: "new", label: "New" },
              { value: "maturing", label: "Maturing" },
              { value: "established", label: "Established" },
              { value: "unknown", label: "Not sure" },
            ]}
            onChange={(v) => setState((s) => ({ ...s, filter_maturity: v }))}
          />
          <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2 text-sm">
            <span>
              <span className="block font-medium text-foreground">Seeded media used</span>
              <span className="block text-xs text-muted-foreground">
                Media transferred from an established healthy filter
              </span>
            </span>
            <input
              type="checkbox"
              checked={state.seeded_media}
              onChange={(e) => setState((s) => ({ ...s, seeded_media: e.target.checked }))}
              className="h-5 w-5 accent-[var(--color-teal)]"
            />
          </label>

          <div className="border-t pt-3">
            <Segmented<CycleStatus>
              label="Nitrogen-cycle status"
              value={state.cycle_status}
              options={[
                { value: "not_started", label: "Not started" },
                { value: "cycling", label: "Cycling" },
                { value: "verified", label: "Verified by tests" },
                { value: "unknown", label: "Not sure" },
              ]}
              onChange={(v) => setState((s) => ({ ...s, cycle_status: v }))}
            />
          </div>
          <Segmented<CycleMethod>
            label="Cycling method"
            value={state.cycle_method}
            options={[
              { value: "fishless", label: "Fishless" },
              { value: "fish_in", label: "Fish-in" },
              { value: "unknown", label: "Not sure" },
            ]}
            onChange={(v) => setState((s) => ({ ...s, cycle_method: v }))}
          />
          <WaterTestField
            label="Tank age (weeks)"
            value={state.tank_age_weeks}
            step={1}
            onChange={(v) => setState((s) => ({ ...s, tank_age_weeks: v }))}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <WaterTestField
              label="Ammonia (mg/L)"
              value={state.ammonia_mg_l}
              onChange={(v) => setState((s) => ({ ...s, ammonia_mg_l: v }))}
            />
            <WaterTestField
              label="Nitrite (mg/L)"
              value={state.nitrite_mg_l}
              onChange={(v) => setState((s) => ({ ...s, nitrite_mg_l: v }))}
            />
            <WaterTestField
              label="Nitrate (mg/L)"
              value={state.nitrate_mg_l}
              onChange={(v) => setState((s) => ({ ...s, nitrate_mg_l: v }))}
            />
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">
              Water tested on (within the last 7 days)
            </span>
            <input
              type="date"
              value={state.water_tested_on ?? ""}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  water_tested_on: e.target.value || null,
                }))
              }
              className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          {((state.ammonia_mg_l ?? 0) > 0 || (state.nitrite_mg_l ?? 0) > 0) && (
            <p className="flex items-start gap-1.5 rounded-lg bg-coral/10 px-2.5 py-2 text-xs font-semibold text-foreground">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" aria-hidden />
              Detectable ammonia or nitrite is a stop signal. Do not add fish until the cause is
              resolved and both remain at 0 mg/L.
            </p>
          )}
          <Segmented<MaintenanceFrequency>
            label="Maintenance"
            value={state.maintenance_frequency}
            options={[
              { value: "weekly", label: "Weekly" },
              { value: "fortnightly", label: "Fortnightly" },
              { value: "monthly", label: "Monthly" },
            ]}
            onChange={(v) => setState((s) => ({ ...s, maintenance_frequency: v }))}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="livestock"
        id="step-livestock"
        className="rounded-2xl border bg-background/60 px-3"
      >
        <AccordionTrigger className="py-3 hover:no-underline">
          <StepHeader
            n={3}
            title="Fish"
            summary={
              fishCount === 0
                ? "No fish yet"
                : `${fishCount} fish · ${state.species.length} species`
            }
            icon={<Fish className="h-3.5 w-3.5" aria-hidden />}
          />
        </AccordionTrigger>
        <AccordionContent className="pb-3">
          <SpeciesAdder state={state} setState={setState} species={species} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="aquascape"
        id="step-aquascape"
        className="rounded-2xl border bg-background/60 px-3"
      >
        <AccordionTrigger className="py-3 hover:no-underline">
          <StepHeader
            n={4}
            title="Aquascape"
            summary={
              scapeCount === 0
                ? "No plants or hardscape yet"
                : `${state.plants.length} plants · ${state.hardscape.length} hardscape`
            }
            icon={<Sprout className="h-3.5 w-3.5" aria-hidden />}
          />
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-3">
          <Segmented<PlantDensity>
            label="Plant density"
            value={state.plant_density}
            options={[
              { value: "none", label: "None" },
              { value: "light", label: "Light" },
              { value: "medium", label: "Medium" },
              { value: "heavy", label: "Heavy" },
            ]}
            onChange={(v) => setState((s) => ({ ...s, plant_density: v }))}
          />
          <Tabs defaultValue="plants" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="plants">Plants</TabsTrigger>
              <TabsTrigger value="hardscape">Hardscape</TabsTrigger>
            </TabsList>
            <TabsContent value="plants" className="mt-3">
              <PlantAdder state={state} setState={setState} plants={plants} />
            </TabsContent>
            <TabsContent value="hardscape" className="mt-3">
              <HardscapeAdder state={state} setState={setState} hardscape={hardscape} />
            </TabsContent>
          </Tabs>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function StepHeader({
  n,
  title,
  summary,
  icon,
}: {
  n: number;
  title: string;
  summary: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
        {n}
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </p>
        <p className="truncate text-xs font-normal text-muted-foreground">{summary}</p>
      </div>
    </div>
  );
}

function DimField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const invalid = value < MIN_DIM;
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        min={MIN_DIM}
        aria-invalid={invalid || undefined}
        className={`w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${
          invalid ? "border-coral" : ""
        }`}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}

function WaterTestField({
  label,
  value,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number | null;
  step?: number;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        inputMode="decimal"
        value={value ?? ""}
        placeholder="Not tested"
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? null : Math.max(0, Number(raw)));
        }}
        className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1 rounded-xl bg-muted p-1" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            className={`min-h-11 rounded-lg px-3 py-1.5 text-xs transition ${
              value === o.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpeciesAdder({
  state,
  setState,
  species,
}: {
  state: TankState;
  setState: Props["setState"];
  species: Species[];
}) {
  const [q, setQ] = useState("");
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setShowResults(false), showResults);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return species.slice(0, 8);
    return species
      .filter(
        (s) =>
          s.common_name.toLowerCase().includes(term) ||
          s.scientific_name.toLowerCase().includes(term),
      )
      .slice(0, 12);
  }, [q, species]);

  function add(sp: Species) {
    setState((s) => {
      const existing = s.species.find((x) => x.species.id === sp.id);
      if (existing) {
        return {
          ...s,
          species: s.species.map((x) =>
            x.species.id === sp.id ? { ...x, quantity: x.quantity + 1 } : x,
          ),
        };
      }
      const adaptedWater = adaptWaterToFirstSpecies(s, sp);
      return {
        ...s,
        ...adaptedWater,
        species: [...s.species, { species: sp, quantity: sp.is_schooling ? sp.min_group_size : 1 }],
      };
    });
    setQ("");
    setShowResults(false);
  }

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fish</h3>
      <div className="relative" ref={containerRef}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          className="min-h-11 w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search species…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          aria-label="Search species"
        />
        {showResults && (
          <div className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-xl border bg-popover shadow-lg">
            {results.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">No species match.</div>
            )}
            {results.map((sp) => (
              <div
                key={sp.id}
                className="flex w-full items-start justify-between gap-2 border-b p-3 text-left last:border-b-0 hover:bg-muted"
              >
                <button
                  type="button"
                  className="flex flex-1 items-start gap-2 text-left"
                  onClick={() => add(sp)}
                  aria-label={`Add ${sp.common_name} to tank`}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{sp.common_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {sp.scientific_name} · {BIOTOPE_LABEL[sp.biotope_region]}
                    </div>
                  </div>
                  <Plus className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                </button>
                <Link
                  to="/species/$id"
                  params={{ id: sp.id }}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`View guide for ${sp.common_name}`}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <Info className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            ))}{" "}
          </div>
        )}
      </div>

      {state.species.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-background px-3 py-2 text-xs text-muted-foreground">
          No fish yet — search above to add some.
        </p>
      ) : (
        <ul className="space-y-2">
          {state.species.map((s) => (
            <li
              key={s.species.id}
              className="flex items-center justify-between rounded-xl border bg-card px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.species.common_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {BIOTOPE_LABEL[s.species.biotope_region]}
                  </p>
                </div>
                <Link
                  to="/species/$id"
                  params={{ id: s.species.id }}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View guide for ${s.species.common_name}`}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Info className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <QtyStepper
                itemLabel={s.species.common_name}
                value={s.quantity}
                onChange={(v) =>
                  setState((st) => ({
                    ...st,
                    species: st.species
                      .map((x) => (x.species.id === s.species.id ? { ...x, quantity: v } : x))
                      .filter((x) => x.quantity > 0),
                  }))
                }
                onRemove={() =>
                  setState((st) => ({
                    ...st,
                    species: st.species.filter((x) => x.species.id !== s.species.id),
                  }))
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PlantAdder({
  state,
  setState,
  plants,
}: {
  state: TankState;
  setState: Props["setState"];
  plants: Plant[];
}) {
  return (
    <ItemAdder<Plant>
      title="Plants"
      items={plants}
      current={state.plants.map((p) => ({
        id: p.plant.id,
        item: p.plant,
        quantity: p.quantity,
      }))}
      getLabel={(p) => p.common_name}
      getSubtitle={(p) => `${BIOTOPE_LABEL[p.biotope_region]} · ${p.light_need} light`}
      onAdd={(plant) =>
        setState((s) => {
          const ex = s.plants.find((x) => x.plant.id === plant.id);
          if (ex)
            return {
              ...s,
              plants: s.plants.map((x) =>
                x.plant.id === plant.id ? { ...x, quantity: x.quantity + 1 } : x,
              ),
            };
          return { ...s, plants: [...s.plants, { plant, quantity: 1 }] };
        })
      }
      onChangeQty={(id, v) =>
        setState((s) => ({
          ...s,
          plants: s.plants
            .map((x) => (x.plant.id === id ? { ...x, quantity: v } : x))
            .filter((x) => x.quantity > 0),
        }))
      }
      onRemove={(id) =>
        setState((s) => ({
          ...s,
          plants: s.plants.filter((x) => x.plant.id !== id),
        }))
      }
    />
  );
}

function HardscapeAdder({
  state,
  setState,
  hardscape,
}: {
  state: TankState;
  setState: Props["setState"];
  hardscape: Hardscape[];
}) {
  return (
    <ItemAdder<Hardscape>
      title="Hardscape"
      items={hardscape}
      current={state.hardscape.map((h) => ({
        id: h.hardscape.id,
        item: h.hardscape,
        quantity: h.quantity,
      }))}
      getLabel={(h) => h.name}
      getSubtitle={(h) => `${h.type.replace("_", " ")} · ${BIOTOPE_LABEL[h.biotope_region]}`}
      onAdd={(item) =>
        setState((s) => {
          const ex = s.hardscape.find((x) => x.hardscape.id === item.id);
          if (ex)
            return {
              ...s,
              hardscape: s.hardscape.map((x) =>
                x.hardscape.id === item.id ? { ...x, quantity: x.quantity + 1 } : x,
              ),
            };
          return {
            ...s,
            hardscape: [...s.hardscape, { hardscape: item, quantity: 1 }],
          };
        })
      }
      onChangeQty={(id, v) =>
        setState((s) => ({
          ...s,
          hardscape: s.hardscape
            .map((x) => (x.hardscape.id === id ? { ...x, quantity: v } : x))
            .filter((x) => x.quantity > 0),
        }))
      }
      onRemove={(id) =>
        setState((s) => ({
          ...s,
          hardscape: s.hardscape.filter((x) => x.hardscape.id !== id),
        }))
      }
    />
  );
}

interface ItemAdderProps<T extends { id: string }> {
  title: string;
  items: T[];
  current: Array<{ id: string; item: T; quantity: number }>;
  getLabel: (item: T) => string;
  getSubtitle: (item: T) => string;
  onAdd: (item: T) => void;
  onChangeQty: (id: string, v: number) => void;
  onRemove: (id: string) => void;
}

function ItemAdder<T extends { id: string }>(props: ItemAdderProps<T>) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setOpen(false), open);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? props.items.filter((x) => props.getLabel(x).toLowerCase().includes(term))
      : props.items;
    return list.slice(0, 10);
  }, [q, props]);

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {props.title}
      </h3>
      <div className="relative" ref={containerRef}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          className="w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder={`Search ${props.title.toLowerCase()}…`}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label={`Search ${props.title.toLowerCase()}`}
        />
        {open && (
          <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-popover shadow-lg">
            {results.map((it) => (
              <button
                key={it.id}
                type="button"
                aria-label={`Add ${props.getLabel(it)}`}
                className="flex w-full items-start justify-between gap-2 border-b p-3 text-left last:border-b-0 hover:bg-muted"
                onClick={() => {
                  props.onAdd(it);
                  setQ("");
                  setOpen(false);
                }}
              >
                <div>
                  <div className="text-sm font-medium">{props.getLabel(it)}</div>
                  <div className="text-xs text-muted-foreground">{props.getSubtitle(it)}</div>
                </div>
                <Plus className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </div>

      {props.current.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-background px-3 py-2 text-xs text-muted-foreground">
          No {props.title.toLowerCase()} yet — search above to add some.
        </p>
      ) : (
        <ul className="space-y-2">
          {props.current.map(({ id, item, quantity }) => (
            <li
              key={id}
              className="flex items-center justify-between rounded-xl border bg-card px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{props.getLabel(item)}</p>
                <p className="truncate text-xs text-muted-foreground">{props.getSubtitle(item)}</p>
              </div>
              <QtyStepper
                itemLabel={props.getLabel(item)}
                value={quantity}
                onChange={(v) => props.onChangeQty(id, v)}
                onRemove={() => props.onRemove(id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function QtyStepper({
  value,
  onChange,
  onRemove,
  itemLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  onRemove: () => void;
  itemLabel: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label={`Decrease quantity of ${itemLabel}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg border p-1 text-muted-foreground hover:bg-muted"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="w-6 text-center text-sm font-medium" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={`Increase quantity of ${itemLabel}`}
        className="rounded-lg border p-1 text-muted-foreground hover:bg-muted"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${itemLabel}`}
        className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg p-1 text-muted-foreground hover:bg-coral/15 hover:text-coral"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
