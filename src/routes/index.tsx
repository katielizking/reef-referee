import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Fish, ImageDown, Loader2, Ruler, Save, Share2, Waves, X } from "lucide-react";
import { toast } from "sonner";

import { TankSetupPanel } from "@/components/TankSetupPanel";
import { BuilderSteps, type StepId } from "@/components/BuilderSteps";
import { ClientOnlyTankScene } from "@/components/tank3d/ClientOnlyTankScene";
import { SelectedObjectPanel } from "@/components/tank3d/SelectedObjectPanel";
import { SceneToolbar } from "@/components/tank3d/SceneToolbar";
import { useTankHistory } from "@/components/tank3d/useTankHistory";
import { useEditorStore } from "@/components/tank3d/editorStore";
import { ScorecardPanel } from "@/components/Scorecard";
import { MobileScoreBar, MobileWelfareSummary } from "@/components/MobileScoreBar";
import { PreStockChecklist, useSaveGate } from "@/components/PreStockChecklist";
import { EditorOnboarding } from "@/components/EditorOnboarding";
import { scoreTank } from "@/lib/scoring";
import { adaptWaterToFirstSpecies, pickDefaultFilter } from "@/lib/defaults";
import { PRESET_KEY, TANK_PRESETS } from "@/lib/presets";
import type { TankState } from "@/lib/types";
import { absoluteUrl } from "@/lib/site";
import { shareScoreCard } from "@/lib/share-card";
import { recordScoreEvent } from "@/lib/commercial";
import {
  loadTankBySlug,
  saveTank,
  useFilters,
  useHardscape,
  usePlants,
  useSpecies,
} from "@/lib/data";

const HERO_DISMISS_KEY = "fishtankr:hero-dismissed";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { tank?: string; remix?: string } => ({
    tank: typeof search.tank === "string" ? search.tank : undefined,
    remix: typeof search.remix === "string" ? search.remix : undefined,
  }),
  head: () => ({
    meta: [
      { title: "FishTankr | Smarter tanks. Happier fish." },
      {
        name: "description",
        content:
          "Plan your setup, check your stocking and understand the biology behind a healthy aquarium with simple tools built around fish welfare.",
      },
      { property: "og:url", content: absoluteUrl("/") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
  }),
  component: Builder,
});

const DEFAULT_STATE: TankState = {
  name: "My tank",
  length_cm: 90,
  width_cm: 40,
  height_cm: 45,
  filter: null,
  maintenance_frequency: "weekly",
  biological_media_level: "standard",
  filter_maturity: "unknown",
  cycle_status: "unknown",
  cycle_method: "unknown",
  tank_age_weeks: null,
  ammonia_mg_l: null,
  nitrite_mg_l: null,
  nitrate_mg_l: null,
  water_tested_on: null,
  seeded_media: false,
  target_ph: 7.0,
  target_temp_c: 25,
  plant_density: "medium",
  species: [],
  plants: [],
  hardscape: [],
};

function Builder() {
  const { tank: tankSlug, remix: remixSlug } = Route.useSearch();
  const sourceSlug = tankSlug ?? remixSlug;
  const [state, setState] = useState<TankState>(DEFAULT_STATE);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(undefined);
  const [loadingTank, setLoadingTank] = useState(Boolean(sourceSlug));
  const [openSteps, setOpenSteps] = useState<StepId[]>(["tank"]);
  const [heroDismissed, setHeroDismissed] = useState(true); // start true to avoid SSR flash
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHeroDismissed(window.localStorage.getItem(HERO_DISMISS_KEY) === "1");
  }, []);

  function dismissHero() {
    setHeroDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HERO_DISMISS_KEY, "1");
    }
  }

  const species = useSpecies();
  const plants = usePlants();
  const hardscape = useHardscape();
  const filters = useFilters();

  const scorecard = useMemo(() => scoreTank(state), [state]);
  const gate = useSaveGate(scorecard, state);
  const history = useTankHistory(state, setState);
  const selected = useEditorStore((s) => s.selected);

  const ready = species.data && plants.data && hardscape.data && filters.data;
  const showHero = !sourceSlug && !heroDismissed && state.species.length === 0;

  useEffect(() => {
    if (!sourceSlug) {
      setLoadingTank(false);
      return;
    }

    let cancelled = false;
    setLoadingTank(true);

    void loadTankBySlug(sourceSlug)
      .then((data) => {
        if (cancelled) return;
        if (!data) throw new Error("Tank not found");

        setState({
          name: remixSlug ? `${data.tank.name} remix` : data.tank.name,
          length_cm: data.tank.length_cm,
          width_cm: data.tank.width_cm,
          height_cm: data.tank.height_cm,
          filter: data.filter,
          maintenance_frequency: data.tank.maintenance_frequency,
          biological_media_level:
            data.tank.biological_media_level ?? data.filter?.biological_media_level ?? "standard",
          filter_maturity: data.tank.filter_maturity ?? "unknown",
          cycle_status: data.tank.cycle_status ?? "unknown",
          cycle_method: data.tank.cycle_method ?? "unknown",
          tank_age_weeks: data.tank.tank_age_weeks ?? null,
          ammonia_mg_l: data.tank.ammonia_mg_l ?? null,
          nitrite_mg_l: data.tank.nitrite_mg_l ?? null,
          nitrate_mg_l: data.tank.nitrate_mg_l ?? null,
          water_tested_on: data.tank.water_tested_on ?? null,
          seeded_media: data.tank.seeded_media ?? false,
          target_ph: data.tank.target_ph,
          target_temp_c: data.tank.target_temp_c,
          plant_density: data.tank.plant_density,
          species: data.species,
          plants: data.plants,
          hardscape: data.hardscape,
        });
        setSavedId(remixSlug ? undefined : data.tank.id);
        setHeroDismissed(true);
        toast.success(remixSlug ? `Ready to remix ${data.tank.name}` : `Loaded ${data.tank.name}`);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        toast.error("Couldn't open this tank", {
          description: error instanceof Error ? error.message : "Try again in a moment.",
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingTank(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceSlug, remixSlug]);

  function jumpToStep(id: StepId) {
    setOpenSteps((prev) => (prev.includes(id) ? prev : [...prev, id]));
    requestAnimationFrame(() => {
      const el = document.getElementById(`step-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const dims = useMemo(() => {
    const CM_PER_UNIT = 10;
    const x = Math.max(state.length_cm, 20) / CM_PER_UNIT;
    const y = Math.max(state.height_cm, 20) / CM_PER_UNIT;
    const z = Math.max(state.width_cm, 20) / CM_PER_UNIT;
    const substrateHeight = Math.min(0.4, y * 0.15);
    return { x, y, z, substrateY: -y / 2 + substrateHeight };
  }, [state.length_cm, state.width_cm, state.height_cm]);

  useEffect(() => {
    if (!species.data || sourceSlug) return;
    const raw = sessionStorage.getItem("fishtankr:pending-add");
    if (!raw) return;
    sessionStorage.removeItem("fishtankr:pending-add");
    let ids: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      ids = Array.isArray(parsed) ? parsed : [raw];
    } catch {
      ids = [raw];
    }
    setState((prev) => {
      const toAdd = ids
        .map((id) => species.data!.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => !!s)
        .filter((s) => !prev.species.some((row) => row.species.id === s.id));
      if (toAdd.length === 0) {
        toast.info("Those fish are already in your tank");
        return prev;
      }
      toast.success(
        toAdd.length === 1
          ? `Added ${toAdd[0].common_name} to your tank`
          : `Added ${toAdd.length} species to your tank`,
      );
      return {
        ...prev,
        ...(toAdd.length > 0 ? adaptWaterToFirstSpecies(prev, toAdd[0]) : {}),
        species: [
          ...prev.species,
          ...toAdd.map((s) => ({
            species: s,
            quantity: s.is_schooling ? s.min_group_size : 1,
          })),
        ],
      };
    });
  }, [species.data, sourceSlug]);

  // Load a preset (from /saved starter templates)
  useEffect(() => {
    if (!species.data || sourceSlug) return;
    const raw = sessionStorage.getItem(PRESET_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PRESET_KEY);
    const preset = TANK_PRESETS.find((p) => p.id === raw);
    if (!preset) return;
    const matches = preset.suggested
      .map((sci) => species.data!.find((s) => s.scientific_name === sci))
      .filter((s): s is NonNullable<typeof s> => !!s);
    setState((prev) => ({
      ...prev,
      ...preset.base,
      species: matches.map((s) => ({
        species: s,
        quantity: s.is_schooling ? s.min_group_size : 1,
      })),
    }));
    toast.success(`Loaded ${preset.name}`);
  }, [species.data, sourceSlug]);

  // Auto-suggest a filter once dimensions are known and none is chosen.
  useEffect(() => {
    if (!filters.data || state.filter) return;
    const pick = pickDefaultFilter(filters.data, {
      length_cm: state.length_cm,
      width_cm: state.width_cm,
      height_cm: state.height_cm,
    });
    if (pick) {
      setState((s) =>
        s.filter
          ? s
          : {
              ...s,
              filter: pick,
              biological_media_level: pick.biological_media_level,
            },
      );
    }
  }, [filters.data, state.filter, state.length_cm, state.width_cm, state.height_cm]);

  // Capture a history snapshot when the state has settled after any edit
  // (drag commits itself synchronously on pointer-up).
  useEffect(() => {
    const t = setTimeout(() => history.commit(), 500);
    return () => clearTimeout(t);
  }, [state, history]);

  async function doSave(share: boolean) {
    try {
      setSaving(true);
      const row = await saveTank(state, savedId);
      recordScoreEvent(scorecard);
      setSavedId(row.id);
      if (share) {
        const url = `${window.location.origin}/t/${row.share_slug}`;
        await navigator.clipboard.writeText(url).catch(() => {});
        toast.success("Share link copied", { description: url });
      } else {
        toast.success("Tank saved");
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save this tank", {
        description: err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleSave(share = false) {
    gate.requestSave(share, doSave);
  }

  function scrollToBuilder() {
    const el = document.getElementById("builder");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="mx-auto max-w-[1500px] px-3 py-4 pb-28 sm:px-4 sm:py-6 lg:pb-6">
      {showHero && (
        <section className="relative mb-7 overflow-hidden border border-rule bg-ink sm:mb-10">
          <button
            type="button"
            onClick={dismissHero}
            aria-label="Dismiss welcome"
            className="absolute right-3 top-3 z-20 p-1.5 text-white/60 transition-colors hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>

          <div
            className="pointer-events-none relative h-[52svh] min-h-[320px] max-h-[520px] overflow-hidden [&_canvas]:!h-full"
            aria-hidden
          >
            <div className="absolute inset-0 scale-110">
              <ClientOnlyTankScene state={state} interactive={false} />
            </div>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, color-mix(in srgb, var(--ink) 88%, transparent) 0%, color-mix(in srgb, var(--ink) 55%, transparent) 55%, transparent 100%)",
              }}
            />
          </div>

          <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 sm:justify-center sm:p-10 lg:p-12">
            <span className="science-label text-blue">Tank planner</span>
            <h1 className="mt-4 max-w-[18ch] font-display text-4xl font-bold leading-[.95] tracking-[-.045em] text-white sm:text-5xl lg:text-6xl">
              Plan the tank before you buy the fish.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
              Add the tank and the fish you’re considering. Check the space, water and tank mates.
            </p>
            <p className="data-mono mt-4 text-xs uppercase tracking-[0.14em] text-white/60">
              {state.length_cm} × {state.width_cm} × {state.height_cm} cm ·{" "}
              {Math.round((state.length_cm * state.width_cm * state.height_cm) / 1000)} L
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  dismissHero();
                  scrollToBuilder();
                }}
                className="inline-flex min-h-12 items-center justify-center border border-white bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-transparent hover:text-white"
              >
                Start my tank
              </button>
              <button
                onClick={() => navigate({ to: "/species" })}
                className="inline-flex min-h-12 items-center justify-center border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white"
              >
                Browse fish
              </button>
            </div>
          </div>
        </section>
      )}

      {showHero && (
        <section
          className="mb-8 grid gap-4 rounded-[1.75rem] border bg-card p-5 sm:p-7 lg:grid-cols-[.8fr_1.2fr]"
          aria-labelledby="what-calculators-miss"
        >
          <div>
            <p className="science-label text-primary">More than tank volume</p>
            <h2
              id="what-calculators-miss"
              className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground"
            >
              A litre count is not enough
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Tank volume cannot show conflict, group needs or water fit. Check those before you
              stock.
            </p>
            <Link
              to="/methodology"
              className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline"
            >
              How scoring works
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl bg-muted/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Volume-only view
              </p>
              <p className="mt-2 font-display text-lg font-bold text-foreground">
                Two male bettas · 40 L
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                A litres-and-size formula can miss the territorial conflict.
              </p>
            </article>
            <article className="rounded-2xl border-l-4 border-l-coral bg-coral/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-coral">
                FishTankr verdict
              </p>
              <p className="mt-2 font-display text-lg font-bold text-foreground">Do not stock</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Two male bettas are likely to fight. Keep one betta or house them in separate tanks.
              </p>
            </article>
          </div>
        </section>
      )}

      <div
        id="builder"
        className="mb-5 flex flex-col justify-between gap-3 border-b border-ink/10 pb-4 sm:mb-6 sm:gap-4 sm:pb-5 sm:flex-row sm:items-end"
      >
        <div>
          <h2 className="font-display text-3xl font-bold tracking-[-.035em] text-foreground">
            Build your tank
          </h2>
          <p className="text-sm text-muted-foreground">
            Add the setup. Check each choice as you go.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || state.species.length === 0}
            title={state.species.length === 0 ? "Add fish to save" : undefined}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || state.species.length === 0}
            title={state.species.length === 0 ? "Add fish to share" : undefined}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            onClick={() =>
              void shareScoreCard(scorecard, state)
                .then((result) =>
                  toast.success(
                    result === "shared" ? "Score card shared" : "Score card downloaded",
                  ),
                )
                .catch((error) =>
                  toast.error("Couldn't create score card", {
                    description: error instanceof Error ? error.message : "Try again.",
                  }),
                )
            }
            disabled={scorecard.overall === null}
            title={
              scorecard.overall === null
                ? "Add fish to create a score card"
                : "Share your score as an image"
            }
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImageDown className="h-4 w-4" />
            Card
          </button>
        </div>
      </div>

      {!ready || loadingTank ? (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <BuilderSteps state={state} onJump={jumpToStep} />
          <MobileWelfareSummary scorecard={scorecard} />
          <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(280px,320px)_minmax(520px,1fr)_minmax(300px,340px)]">
            <aside className="order-2 fishtankr-panel rounded-[1.5rem] p-3 sm:rounded-[1.75rem] sm:p-4 xl:order-1 xl:sticky xl:top-24">
              <TankSetupPanel
                state={state}
                setState={setState}
                species={species.data!}
                plants={plants.data!}
                hardscape={hardscape.data!}
                filters={filters.data!}
                openSteps={openSteps}
                setOpenSteps={setOpenSteps}
              />
            </aside>
            <div className="order-1 space-y-4 xl:order-2">
              <section className="overflow-hidden rounded-[1.5rem] border border-ink/15 bg-ink p-2 sm:rounded-[2rem] shadow-[0_28px_70px_rgba(18,35,46,.18)] sm:p-3">
                <header className="flex flex-col items-stretch gap-2 px-2 pb-3 pt-1 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-3">
                  <div>
                    <p className="science-label text-blue">Live aquarium</p>
                    <p className="mt-1 font-display text-sm font-semibold">{state.name}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] sm:flex sm:flex-wrap font-semibold uppercase tracking-wide text-white/65">
                    <span className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-center">
                      <Ruler className="h-3 w-3 text-blue" /> {state.length_cm} × {state.width_cm} ×{" "}
                      {state.height_cm} cm
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5">
                      <Waves className="h-3 w-3 text-blue" />{" "}
                      {Math.round((state.length_cm * state.width_cm * state.height_cm) / 1000)} L
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5">
                      <Fish className="h-3 w-3 text-lime" />{" "}
                      {state.species.reduce((total, row) => total + row.quantity, 0)} fish
                    </span>
                  </div>
                </header>
                <div className="relative">
                  <ClientOnlyTankScene
                    state={state}
                    setState={setState}
                    commit={history.commit}
                    onRemoveSpecies={(id) =>
                      setState((s) => ({
                        ...s,
                        species: s.species.filter((x) => x.species.id !== id),
                      }))
                    }
                  />
                  {state.species.length === 0 && (
                    <div className="pointer-events-none absolute inset-x-4 top-1/2 z-10 -translate-y-1/2 rounded-2xl border border-white/20 bg-ink/75 p-4 text-center text-white backdrop-blur-sm sm:left-1/2 sm:max-w-sm sm:-translate-x-1/2">
                      <Fish className="mx-auto h-8 w-8 text-lime" aria-hidden />
                      <p className="mt-2 font-display text-base font-bold">
                        Start with your first fish
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-white/75">
                        Add fish under Livestock. We’ll set a starting water range and flag what to
                        check.
                      </p>
                    </div>
                  )}
                  <SceneToolbar
                    canUndo={history.canUndo}
                    canRedo={history.canRedo}
                    onUndo={history.undo}
                    onRedo={history.redo}
                    onResetLayout={() => {
                      setState((s) => ({ ...s, overrides: {} }));
                      history.commit();
                    }}
                  />
                </div>
              </section>

              <EditorOnboarding />

              {selected ? (
                <SelectedObjectPanel
                  state={state}
                  setState={setState}
                  interior={dims}
                  commit={history.commit}
                />
              ) : (
                <div className="fishtankr-panel rounded-[1.75rem] p-4 text-sm text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">Tap an item to edit it.</span>{" "}
                    Drag to move it. Use the panel to rotate, resize, copy or remove it. Undo is in
                    the toolbar.
                  </p>
                </div>
              )}
            </div>

            <aside className="order-3 space-y-4 xl:sticky xl:top-24 xl:self-start">
              <PreStockChecklist
                scorecard={scorecard}
                state={state}
                pendingSave={gate.pendingSave}
                onCancelSave={gate.cancel}
                onConfirmSave={() => gate.confirm(doSave)}
              />
              <ScorecardPanel scorecard={scorecard} />
            </aside>
          </div>
        </>
      )}
      {ready && <MobileScoreBar scorecard={scorecard} />}
    </main>
  );
}
