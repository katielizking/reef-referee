import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Search, Plus, Minus, X, Info, Fish, Sprout } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type {
  BiologicalMediaLevel,
  TankFilterSlot,
  Filter,
  FilterMaturity,
  FilterType,
  Hardscape,
  MaintenanceFrequency,
  Plant,
  PlantDensity,
  Species,
  Substrate,
  TankShape,
  TankState,
} from "@/lib/types";
import { BIOTOPE_LABEL, SUBSTRATE_LABEL, TANK_SHAPE_LABEL } from "@/lib/types";
import { waterLitres } from "@/lib/tank-shape";
import {
  displayLength,
  formatVolume,
  lengthLabel,
  lengthToCm,
  useUnitSystem,
} from "@/lib/units";
import { submitSpeciesRequest } from "@/lib/requests";
import { useOutsideClick } from "@/hooks/useOutsideClick";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StepId } from "@/components/BuilderSteps";

interface Props {
  sections?: StepId[];
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
  sections = ["tank","filter","livestock","aquascape"],
}: Props) {
  const [units, setUnits] = useUnitSystem();
  const litres = Math.round(waterLitres(state));
  const volume = formatVolume(litres, units);
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
      {sections.includes("tank") && <AccordionItem
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
                ? `Set each side ≥ ${displayLength(MIN_DIM, units)} ${lengthLabel(units)}`
                : `${volume} · pH ${state.target_ph.toFixed(1)} · ${state.target_temp_c}°C`
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
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Units</span>
            <div className="flex rounded-lg bg-muted p-0.5">
              {(["metric", "us"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={units === u}
                  onClick={() => setUnits(u)}
                  className={`min-h-9 rounded-md px-2.5 text-xs transition ${
                    units === u
                      ? "bg-card font-medium text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {u === "metric" ? "cm / L" : "in / gal"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <DimField
              label={`Length (${lengthLabel(units)})`}
              value={displayLength(state.length_cm, units)}
              min={displayLength(MIN_DIM, units)}
              onChange={(v) => setState((s) => ({ ...s, length_cm: lengthToCm(v, units) }))}
            />
            <DimField
              label={`Width (${lengthLabel(units)})`}
              value={displayLength(state.width_cm, units)}
              min={displayLength(MIN_DIM, units)}
              onChange={(v) => setState((s) => ({ ...s, width_cm: lengthToCm(v, units) }))}
            />
            <DimField
              label={`Height (${lengthLabel(units)})`}
              value={displayLength(state.height_cm, units)}
              min={displayLength(MIN_DIM, units)}
              onChange={(v) => setState((s) => ({ ...s, height_cm: lengthToCm(v, units) }))}
            />
          </div>
          {dimInvalid && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-coral">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              Each side needs to be at least {displayLength(MIN_DIM, units)} {lengthLabel(units)}.
            </p>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-foreground/80">Shape</span>
            <select
              className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={state.tank_shape ?? "rectangle"}
              onChange={(e) =>
                setState((st) => ({ ...st, tank_shape: e.target.value as TankShape }))
              }
            >
              {(Object.keys(TANK_SHAPE_LABEL) as TankShape[]).map((k) => (
                <option key={k} value={k}>
                  {TANK_SHAPE_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-xl bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Water volume</span>{" "}
            <span className="font-semibold">{volume}</span>
            {(state.tank_shape ?? "rectangle") !== "rectangle" && (
              <span className="ml-1 text-xs text-muted-foreground">
                for the shape, not the full box
              </span>
            )}
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-foreground/80">Substrate</span>
            <select
              className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={state.substrate ?? "gravel"}
              onChange={(e) =>
                setState((st) => ({ ...st, substrate: e.target.value as Substrate }))
              }
            >
              {(Object.keys(SUBSTRATE_LABEL) as Substrate[]).map((k) => (
                <option key={k} value={k}>
                  {SUBSTRATE_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="space-y-1.5">
            <legend className="mb-1 text-sm text-foreground/80">Equipment</legend>
            {(
              [
                ["has_heater", "Heater", true],
                ["has_light", "Light", true],
                ["has_co2", "CO2", false],
              ] as const
            ).map(([key, label, fallback]) => (
              <label key={key} className="flex min-h-9 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={state[key] ?? fallback}
                  onChange={(e) => setState((st) => ({ ...st, [key]: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--color-teal)]"
                />
                {label}
              </label>
            ))}
          </fieldset>
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
      </AccordionItem>}

      {sections.includes("filter") && <AccordionItem
        value="filter"
        id="step-filter"
        className="rounded-2xl border bg-background/60 px-3"
      >
        <AccordionTrigger className="min-h-14 py-3 hover:no-underline">
          <StepHeader
            n={2}
            title="Filter and maintenance"
            summary={state.filter ? state.filter.name : "Pick a filter"}
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
                {f.name}. {FILTER_TYPE_LABEL[f.filter_type]}, rated {f.rated_litres} L
              </option>
            ))}
          </select>
          {filterUndersized && (
            <p className="flex items-start gap-1.5 rounded-lg bg-warn/15 px-2.5 py-1.5 text-xs font-medium text-foreground">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" aria-hidden />
              <span>
                This filter is rated for {formatVolume(state.filter!.rated_litres, units)} but your
                tank is {volume}. Consider a larger filter, or run a second one.
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
          <ExtraFilters state={state} setState={setState} filters={filters} />

          <div className="rounded-xl border bg-background px-3 py-2 text-xs text-muted-foreground">
            Cycling and water tests moved to the{" "}
            <Link to="/tracker" className="font-semibold text-foreground underline">
              tank tracker
            </Link>
            , where you can log each test for every tank you keep.
          </div>
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
      </AccordionItem>}

      {sections.includes("livestock") && <AccordionItem
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
      </AccordionItem>}

      {sections.includes("aquascape") && <AccordionItem
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
      </AccordionItem>}
    </Accordion>
  );
}

function ExtraFilters({
  state,
  setState,
  filters,
}: {
  state: TankState;
  setState: Props["setState"];
  filters: Filter[];
}) {
  const [units] = useUnitSystem();
  const extras = state.extra_filters ?? [];

  function update(i: number, patch: Partial<TankFilterSlot>) {
    setState((s) => ({
      ...s,
      extra_filters: (s.extra_filters ?? []).map((slot, idx) =>
        idx === i ? { ...slot, ...patch } : slot,
      ),
    }));
  }

  function addSlot() {
    const first = filters[0];
    if (!first) return;
    setState((s) => ({
      ...s,
      extra_filters: [
        ...(s.extra_filters ?? []),
        {
          filter: first,
          biological_media_level: first.biological_media_level,
          filter_maturity: "unknown" as FilterMaturity,
        },
      ],
    }));
  }

  return (
    <div className="space-y-2 border-t pt-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Other filters</p>
          <p className="text-xs text-muted-foreground">
            Running a second filter or a sponge? Add it here.
          </p>
        </div>
        <button
          type="button"
          onClick={addSlot}
          disabled={!state.filter || filters.length === 0}
          className="min-h-9 rounded-lg border px-2.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          Add filter
        </button>
      </div>

      {extras.map((slot, i) => (
        <div key={i} className="space-y-2 rounded-xl border bg-background px-3 py-2">
          <div className="flex items-center gap-2">
            <select
              className="min-h-11 flex-1 rounded-lg border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={slot.filter.id}
              onChange={(e) => {
                const f = filters.find((x) => x.id === e.target.value);
                if (f) update(i, { filter: f, biological_media_level: f.biological_media_level });
              }}
              aria-label={`Filter ${i + 2}`}
            >
              {filters.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}. {FILTER_TYPE_LABEL[f.filter_type]}, rated{" "}
                  {formatVolume(f.rated_litres, units)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  extra_filters: (s.extra_filters ?? []).filter((_, idx) => idx !== i),
                }))
              }
              aria-label={`Remove filter ${i + 2}`}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <Segmented<BiologicalMediaLevel>
            label="Biological media"
            value={slot.biological_media_level}
            options={[
              { value: "minimal", label: "Minimal" },
              { value: "standard", label: "Standard" },
              { value: "substantial", label: "Substantial" },
            ]}
            onChange={(v) => update(i, { biological_media_level: v })}
          />
        </div>
      ))}

      {extras.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Media adds up across filters. How mature that media is belongs in the tank tracker.
        </p>
      )}
    </div>
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
  min = MIN_DIM,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  const invalid = value < min;
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        min={min}
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

export function SpeciesAdder({
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

      return {
        ...s,

        species: [...s.species, { species: sp, quantity: sp.is_schooling ? sp.min_group_size : 1 }],
      };
    });
    setQ("");
    setShowResults(false);
  }

  return (
    <section className="space-y-2">

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
            {results.length === 0 && <MissingSpecies query={q} />}
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
          No fish yet. Search above to add some.
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

/** Shown when a search finds nothing. Queues the fish for research. */
function MissingSpecies({ query }: { query: string }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = query.trim();

  if (sent) {
    return (
      <div className="p-3 text-sm">
        <p className="font-medium text-foreground">Thanks, that one is on the list.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          We only add a fish once we have a source for its size, water range and behaviour.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 text-sm">
      <p className="text-muted-foreground">No fish match that search.</p>
      {name.length >= 2 && (
        <>
          <button
            type="button"
            disabled={busy}
            className="mt-2 min-h-10 w-full rounded-lg border px-3 text-xs font-medium hover:bg-muted disabled:opacity-60"
            onClick={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                await submitSpeciesRequest(name);
                setSent(true);
              } catch (err) {
                setError(err instanceof Error ? err.message : "That did not send. Try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Sending…" : `Ask us to add "${name}"`}
          </button>
          {error && <p className="mt-1.5 text-xs font-medium text-coral">{error}</p>}
        </>
      )}
    </div>
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
          No {props.title.toLowerCase()} yet. Search above to add some.
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
        className="flex h-11 w-11 items-center justify-center rounded-lg border p-1 text-muted-foreground hover:bg-muted"
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
        className="flex h-11 w-11 items-center justify-center rounded-lg border p-1 text-muted-foreground hover:bg-muted"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${itemLabel}`}
        className="ml-1 flex h-11 w-11 items-center justify-center rounded-lg p-1 text-muted-foreground hover:bg-coral/15 hover:text-coral"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
