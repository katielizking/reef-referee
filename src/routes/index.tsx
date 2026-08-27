import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Fish, Loader2, Ruler, Save, Share2, Waves, X } from "lucide-react";
import { toast } from "sonner";

import { TankSetupPanel } from "@/components/TankSetupPanel";
import { BuilderSteps, type StepId } from "@/components/BuilderSteps";
import { ClientOnlyTankScene } from "@/components/tank3d/ClientOnlyTankScene";
import { SelectedObjectPanel } from "@/components/tank3d/SelectedObjectPanel";
import { SceneToolbar } from "@/components/tank3d/SceneToolbar";
import { useTankHistory } from "@/components/tank3d/useTankHistory";
import { useEditorStore } from "@/components/tank3d/editorStore";
import { ScorecardPanel } from "@/components/Scorecard";
import { MobileScoreBar } from "@/components/MobileScoreBar";
import { HeroTankIllustration } from "@/components/BrandLogo";
import { PreStockChecklist, useSaveGate } from "@/components/PreStockChecklist";
import { scoreTank } from "@/lib/scoring";
import { pickDefaultFilter } from "@/lib/defaults";
import { PRESET_KEY, TANK_PRESETS } from "@/lib/presets";
import type { TankState } from "@/lib/types";
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
  validateSearch: (
    search: Record<string, unknown>,
  ): { tank?: string; remix?: string } => ({
    tank: typeof search.tank === "string" ? search.tank : undefined,
    remix: typeof search.remix === "string" ? search.remix : undefined,
  }),
  head: () => ({
    meta: [
      { title: "FishTankr — Smarter tanks. Happier fish." },
      {
        name: "description",
        content:
          "Plan your setup, check your stocking and understand the biology behind a healthy aquarium with simple tools built around fish welfare.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
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
            data.tank.biological_media_level ??
            data.filter?.biological_media_level ??
            "standard",
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
        toast.success(
          remixSlug
            ? `Ready to remix ${data.tank.name}`
            : `Loaded ${data.tank.name}`,
        );
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        toast.error("Couldn't open this tank", {
          description:
            error instanceof Error ? error.message : "Try again in a moment.",
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
        species: [
          ...prev.species,
          ...toAdd.map((s) => ({ species: s, quantity: 1 })),
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
  }, [
    filters.data,
    state.filter,
    state.length_cm,
    state.width_cm,
    state.height_cm,
  ]);

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
        description:
          err instanceof Error ? err.message : "Try again in a moment.",
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
        <section className="hero-grid fishtankr-panel relative mb-7 grid gap-7 overflow-hidden rounded-[1.5rem] p-5 sm:mb-10 sm:min-h-[430px] sm:rounded-[2rem] sm:p-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)] lg:items-center lg:p-12">
          <button
            type="button"
            onClick={dismissHero}
            aria-label="Dismiss welcome"
            className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <div className="relative z-10">
            <span className="science-label text-primary">
              Aquarium planning, decoded
            </span>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-[.98] tracking-[-.045em] text-ink sm:text-5xl lg:text-6xl">
              Smarter tanks. Happier fish.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Plan your setup, check your stocking and understand the biology
              behind a healthy aquarium with simple tools built around fish
              welfare.
            </p>
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <button
                onClick={() => {
                  dismissHero();
                  scrollToBuilder();
                }}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-6 py-3 sm:w-auto text-sm font-semibold text-white shadow-[0_8px_0_rgba(55,184,198,.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_0_rgba(55,184,198,.34)]"
              >
                Check my tank
              </button>
              <button
                onClick={() => navigate({ to: "/saved" })}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-ink/15 bg-white/70 px-6 py-3 sm:w-auto text-sm font-semibold text-foreground transition-all hover:border-primary hover:bg-white"
              >
                Explore the tools
              </button>
            </div>
          </div>
          <div className="hero-float relative mx-auto w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/55 p-3 shadow-[0_30px_80px_rgba(18,35,46,.15)] backdrop-blur-sm">
            <HeroTankIllustration className="w-full" />
            <div className="absolute -bottom-3 left-5 rounded-full bg-lime px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[.14em] text-ink shadow-sm">
              Live welfare score
            </div>
          </div>
        </section>
      )}

      <div
        id="builder"
        className="mb-5 flex flex-col justify-between gap-3 border-b border-ink/10 pb-4 sm:mb-6 sm:gap-4 sm:pb-5 sm:flex-row sm:items-end"
      >
        <div>
          <h2 className="font-display text-3xl font-bold tracking-[-.035em] text-foreground">
            Design your tank
          </h2>
          <p className="text-sm text-muted-foreground">
            Add livestock, plants and hardscape. Your scorecard updates as you
            go.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || state.species.length === 0}
            title={state.species.length === 0 ? "Add fish to save" : undefined}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
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
        </div>
      </div>

      {!ready || loadingTank ? (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <BuilderSteps state={state} onJump={jumpToStep} />
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
                    <p className="mt-1 font-display text-sm font-semibold">
                      {state.name}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] sm:flex sm:flex-wrap font-semibold uppercase tracking-wide text-white/65">
                    <span className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-center">
                      <Ruler className="h-3 w-3 text-blue" /> {state.length_cm}{" "}
                      × {state.width_cm} × {state.height_cm} cm
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5">
                      <Waves className="h-3 w-3 text-blue" />{" "}
                      {Math.round(
                        (state.length_cm * state.width_cm * state.height_cm) /
                          1000,
                      )}{" "}
                      L
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5">
                      <Fish className="h-3 w-3 text-lime" />{" "}
                      {state.species.reduce(
                        (total, row) => total + row.quantity,
                        0,
                      )}{" "}
                      fish
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
                    <span className="font-semibold text-foreground">
                      Tap any fish, plant or décor to edit it.
                    </span>{" "}
                    Drag to reposition, then rotate, resize, duplicate or remove
                    from the panel that appears. Undo with ⌘Z.
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
