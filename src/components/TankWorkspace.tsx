import { Link, useSearch } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Fish, ImageDown, Loader2, Printer, Ruler, Save, Share2, Waves } from "lucide-react";
import { toast } from "sonner";

import { TankSetupPanel, SpeciesAdder } from "@/components/TankSetupPanel";
import { type StepId } from "@/components/BuilderSteps";
import { useTankHistory } from "@/components/tank3d/useTankHistory";
import { useEditorStore } from "@/components/tank3d/editorStore";
import { ScorecardPanel } from "@/components/Scorecard";
import { TankReport } from "@/components/TankReport";
import { CompatibleSuggestions } from "@/components/CompatibleSuggestions";
import { InvertebrateAdder, InvertebrateChecks } from "@/components/InvertebratePanel";
import { PreStockChecklist, useSaveGate } from "@/components/PreStockChecklist";
import { scoreTank } from "@/lib/scoring";
import { scoringState } from "@/lib/tank-shape";
import { SetupChecks } from "@/components/SetupChecks";

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
  useInvertebrates,
} from "@/lib/data";


import { useTankDraft } from "./TankDraftProvider";
import { WorkInProgressBanner } from "./WorkInProgressBanner";
const VisualiserCanvas = lazy(() => import("./VisualiserCanvas"));
export function TankWorkspace({ visualiser = false }: { visualiser?: boolean }) {
  const { tank: tankSlug, remix: remixSlug } = useSearch({ strict: false });
  const sourceSlug = tankSlug ?? remixSlug;
  const {state,setState,savedId,setSavedId,source,setSource,hydrated,storageStatus} = useTankDraft();
  const requestedSource = sourceSlug ? `${remixSlug ? "remix" : "tank"}:${sourceSlug}` : undefined;
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadingTank, setLoadingTank] = useState(Boolean(sourceSlug));
  const [openSteps, setOpenSteps] = useState<StepId[]>(["tank"]);

  const species = useSpecies();
  const invertebrates = useInvertebrates();
  const plants = usePlants();
  const hardscape = useHardscape();
  const filters = useFilters();

  const scorecard = useMemo(() => scoreTank(scoringState(state)), [state]);
  const gate = useSaveGate(scorecard, state);
  const history = useTankHistory(state, setState);
  const selected = useEditorStore((s) => s.selected);

  const ready = hydrated && species.data && filters.data && (!visualiser || (plants.data && hardscape.data));
  const catalogError = species.isError || filters.isError || (visualiser && (plants.isError || hardscape.isError));

  useEffect(() => {
    if (!hydrated) return;
    if (!sourceSlug || source === requestedSource) {
      setLoadingTank(false);
      return;
    }

    let cancelled = false;
    setLoadingTank(true);
    setLoadError(false);

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
          extra_filters: data.filters,
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
          tank_shape: data.tank.tank_shape ?? "rectangle",
          substrate: data.tank.substrate ?? "gravel",
          has_heater: data.tank.has_heater ?? true,
          has_light: data.tank.has_light ?? true,
          has_co2: data.tank.has_co2 ?? false,
          species: data.species,
          invertebrates: data.invertebrates,
          plants: data.plants,
          hardscape: data.hardscape,
        });
        setSavedId(remixSlug ? undefined : data.tank.id);
        setSource(requestedSource);
        toast.success(remixSlug ? `Ready to remix ${data.tank.name}` : `Loaded ${data.tank.name}`);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(true);
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
  }, [sourceSlug, remixSlug, hydrated, source, requestedSource]);

  useEffect(() => {
    if (!hydrated || !species.data || sourceSlug) return;
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
          ...toAdd.map((s) => ({
            species: s,
            quantity: s.is_schooling ? s.min_group_size : 1,
          })),
        ],
      };
    });
  }, [species.data, sourceSlug, hydrated]);

  // Load a preset (from /saved starter templates)
  useEffect(() => {
    if (!hydrated || !species.data || sourceSlug) return;
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
  }, [species.data, sourceSlug, hydrated]);

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

  const linkSearch = {tank: tankSlug, remix: remixSlug};
  return <>
    <main id="calculator" tabIndex={-1} className="planner-surface">
      <div className="planner-container">
        <div id="builder" className="planner-heading">
          <div>
            {visualiser && <Link to="/calculator" search={linkSearch} className="planner-back">← Back to calculator</Link>}
            <p className="planner-eyebrow">{visualiser ? "YOUR AQUARIUM" : "THE STOCKING CALCULATOR"}</p>
            <h2>{visualiser ? "See your tank take shape." : "Your stocking plan"}</h2>
            <p className="text-sm text-muted-foreground" role="status">{storageStatus}</p>
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
            <button
              onClick={() => window.print()}
              disabled={state.species.length === 0}
              title={
                state.species.length === 0
                  ? "Add fish to print a plan"
                  : "Print a one page plan to take to the shop"
              }
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
        {loadError || catalogError ? <div role="alert" className="planner-error">
          <h3>Couldn't load {loadError ? "this tank" : "the fish and equipment lists"}.</h3>
          <p>Your existing draft is still on this device. Reload to try again.</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div> : !ready || loadingTank ? <div className="min-h-64 flex items-center justify-center gap-3" role="status"><Loader2 className="size-5 animate-spin" /> Loading your tank tools…</div> : <>
          <div className={visualiser ? "visualiser-workspace" : "calculator-workspace"}>
            {visualiser && <Suspense fallback={<p role="status">Loading visualiser…</p>}><VisualiserCanvas state={state} setState={setState} history={history} /></Suspense>}
            <section className="planner-column" aria-labelledby="tank-heading">
              <h3 id="tank-heading">Your tank</h3>
              <p className="planner-help">Dimensions, equipment and water.</p>
              <TankSetupPanel state={state} setState={setState} species={species.data!} plants={plants.data ?? []} hardscape={hardscape.data ?? []} filters={filters.data!} openSteps={openSteps} setOpenSteps={setOpenSteps} sections={visualiser ? ["tank","filter","livestock","aquascape"] : ["tank","filter"]} />
            </section>
            {!visualiser && <section id="your-fish" className="planner-column" aria-labelledby="fish-heading">
              <h3 id="fish-heading">Your fish</h3>
              <p className="planner-help">Search a species, then adjust its group.</p>
              <SpeciesAdder state={state} setState={setState} species={species.data!} />
              <p className="mt-5 text-sm text-muted-foreground">{state.species.length} species · {state.species.reduce((n,row) => n + row.quantity,0)} fish</p>
              <p className="mt-6 text-xs leading-relaxed text-muted-foreground">Water results compare your planned pH and temperature. They do not verify your actual water.</p>
              <Link to="/species" className="planner-text-link">Explore the fish library →</Link>
            </section>}
            <section id="your-results" tabIndex={-1} className="planner-column planner-results" aria-labelledby="results-heading">
              <h3 id="results-heading">Your results</h3>
              <p className="planner-help">What fits, and what needs attention.</p>
              {!state.filter && <p className="planner-notice">Filter details missing. Choose your filter to complete the equipment check.</p>}
              <PreStockChecklist scorecard={scorecard} state={state} pendingSave={gate.pendingSave} onCancelSave={gate.cancel} onConfirmSave={() => gate.confirm(doSave)} />
              <ScorecardPanel scorecard={scorecard} state={state} />
              <div className="fishtankr-panel mt-4 p-5">
                <p className="science-label text-muted-foreground">Shrimp, snails and crabs</p>
                <p className="mt-1 text-sm text-muted-foreground">Optional. Checked separately from your score.</p>
                <div className="mt-3">
                  <InvertebrateAdder state={state} setState={setState} invertebrates={invertebrates.data ?? []} />
                </div>
              </div>
              <InvertebrateChecks state={state} />
              <SetupChecks state={state} />
              <CompatibleSuggestions state={state} setState={setState} species={species.data!} />
              {!visualiser && <Link to="/visualiser" search={linkSearch} className="planner-primary">View this tank <span aria-hidden>→</span></Link>}
            </section>
          </div>
          {!visualiser && <a className="planner-mobile-results" href="#your-results">View your results <span aria-hidden>↑</span></a>}
          <div className="planner-explore"><div><h3>Find your next freshwater setup.</h3><p>Start with an example and make it yours.</p></div><Link to="/saved">Explore example tanks →</Link></div>
        </>}
      </div>
    </main>
    <TankReport scorecard={scorecard} state={state} />
    <WorkInProgressBanner />
  </>;
}
