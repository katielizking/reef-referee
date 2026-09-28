import { Link, useSearch } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  ImageDown,
  Loader2,
  Plus,
  Printer,
  Redo2,
  RotateCcw,
  Save,
  Share2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { TankSetupPanel, SpeciesAdder, type SectionId } from "@/components/TankSetupPanel";
import { NextActionCard } from "@/components/NextActionCard";
import { nextAction } from "@/lib/next-action";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isExample } from "@/lib/example-values";
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

import { DEFAULT_STATE } from "@/lib/tank-draft";
import { TANK_IDEAS, buildIdeaTank } from "@/lib/tank-ideas";
import { parseSizeParam } from "@/lib/tank-links";
import { stateFromFullTank } from "@/lib/tank-journey";
import { PlanNextSteps } from "@/components/PlanNextSteps";
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
  const {
    tank: tankSlug,
    remix: remixSlug,
    idea: ideaSlug,
    size: sizeParam,
  } = useSearch({ strict: false });
  const sourceSlug = tankSlug ?? remixSlug;
  const { state, setState, savedId, setSavedId, source, setSource, hydrated, storageStatus } =
    useTankDraft();
  const requestedSource = sourceSlug ? `${remixSlug ? "remix" : "tank"}:${sourceSlug}` : undefined;
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadingTank, setLoadingTank] = useState(Boolean(sourceSlug));
  const [openSteps, setOpenSteps] = useState<SectionId[]>(["tank"]);
  const [showInverts, setShowInverts] = useState(false);
  const [savedShareSlug, setSavedShareSlug] = useState<string>();
  // The plan's share link, from the latest save or the saved plan that was opened.
  const planShareSlug =
    savedShareSlug ?? (savedId && source?.startsWith("tank:") ? source.slice(5) : undefined);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const species = useSpecies();
  const invertebrates = useInvertebrates();
  const plants = usePlants();
  const hardscape = useHardscape();
  const filters = useFilters();

  // Refresh saved species snapshots when the catalogue receives a care correction.
  useEffect(() => {
    if (!hydrated || !species.data) return;
    setState((previous) => {
      let changed = false;
      const rows = previous.species.map((row) => {
        const current = species.data!.find((s) => s.id === row.species.id);
        if (!current || JSON.stringify(current) === JSON.stringify(row.species)) return row;
        changed = true;
        return { ...row, species: current };
      });
      return changed ? { ...previous, species: rows } : previous;
    });
  }, [hydrated, species.data, state.species, setState]);

  const scorecard = useMemo(() => scoreTank(scoringState(state)), [state]);
  const gate = useSaveGate(scorecard, state);
  const hasFish = state.species.length > 0;
  const next = useMemo(() => nextAction(scorecard, state), [scorecard, state]);
  // Size and fish come first. Water, equipment and filter settings appear once
  // there is a fish to check them against, or when the plan already uses them.
  const showAdvanced = hasFish || !isExample(state, "water") || state.filter !== null;

  function openSection(section: SectionId) {
    setOpenSteps((prev) => (prev.includes(section) ? prev : [...prev, section]));
    requestAnimationFrame(() =>
      document
        .getElementById(`step-${section}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  function shareCard() {
    void shareScoreCard(scorecard, state)
      .then((result) =>
        toast.success(result === "shared" ? "Score card shared" : "Score card image downloaded"),
      )
      .catch((error) =>
        toast.error("Couldn't create score card", {
          description: error instanceof Error ? error.message : "Try again.",
        }),
      );
  }
  const history = useTankHistory(state, setState);
  const selected = useEditorStore((s) => s.selected);

  const ready =
    hydrated && species.data && filters.data && (!visualiser || (plants.data && hardscape.data));
  const catalogError =
    species.isError || filters.isError || (visualiser && (plants.isError || hardscape.isError));

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

        setState(stateFromFullTank(data, remixSlug ? `${data.tank.name} remix` : data.tank.name));
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

  // ?idea=<slug> opens a tank idea and ?size=LxWxH starts a plan at that size. Each link
  // applies once (tracked in `source`), and Undo brings back the plan it replaced.
  useEffect(() => {
    if (!hydrated || !species.data || sourceSlug) return;
    if (ideaSlug) {
      const key = `idea:${ideaSlug}`;
      if (source === key) return;
      const idea = TANK_IDEAS.find((i) => i.slug === ideaSlug);
      setSource(key);
      if (!idea) {
        toast.error("That tank idea no longer exists.");
        return;
      }
      try {
        setState(buildIdeaTank(idea, species.data));
        setSavedId(undefined);
        toast.success(`Loaded ${idea.title}`, {
          description: "Use Undo to get your previous plan back.",
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load this idea.");
      }
      return;
    }
    if (sizeParam) {
      const key = `size:${sizeParam}`;
      if (source === key) return;
      setSource(key);
      const dims = parseSizeParam(sizeParam);
      if (!dims) return;
      setState((prev) => ({
        ...prev,
        length_cm: dims[0],
        width_cm: dims[1],
        height_cm: dims[2],
        exampleValues: { ...prev.exampleValues, size: false },
      }));
      toast.success(`Tank set to ${dims.join(" × ")} cm`);
    }
  }, [
    hydrated,
    species.data,
    sourceSlug,
    ideaSlug,
    sizeParam,
    source,
    setState,
    setSavedId,
    setSource,
  ]);

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
      if (!visualiser) recordScoreEvent(scorecard);
      setSavedId(row.id);
      setSavedShareSlug(row.share_slug);
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
    if (visualiser) {
      void doSave(share);
      return;
    }
    gate.requestSave(share, doSave);
  }

  function handleReset() {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    setConfirmingReset(false);
    setState({ ...DEFAULT_STATE });
    setSavedId(undefined);
    // Mark any ?tank=/?remix= parameter as consumed so the load effect does
    // not immediately re-fetch the tank and undo the reset.
    setSource(requestedSource);
    toast.success("Plan reset to a blank tank", {
      description: "Use undo if you want your previous plan back.",
    });
  }

  const linkSearch = { tank: tankSlug, remix: remixSlug };
  return (
    <>
      <main id="calculator" tabIndex={-1} className="planner-surface">
        <div className="planner-container">
          <div id="builder" className="planner-heading">
            <div>
              {visualiser && (
                <Link to="/calculator" search={linkSearch} className="planner-back">
                  ← Back to calculator
                </Link>
              )}
              <p className="planner-eyebrow">
                {visualiser ? "YOUR AQUARIUM" : "THE STOCKING CALCULATOR"}
              </p>
              <h1>{visualiser ? "See your tank take shape." : "Your stocking plan"}</h1>
              <Link to="/tank-ideas" className="text-sm text-primary underline">
                Need a starting point? Explore Tank Ideas
              </Link>
              <p className="text-sm text-muted-foreground" role="status">
                {storageStatus}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              <button
                onClick={() => history.undo()}
                disabled={!history.canUndo}
                title="Undo your last change"
                aria-label="Undo last change"
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </button>
              <button
                onClick={() => history.redo()}
                disabled={!history.canRedo}
                title="Redo a change you undid"
                aria-label="Redo change"
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Redo2 className="h-4 w-4" />
                Redo
              </button>
              <button
                onClick={handleReset}
                onBlur={() => setConfirmingReset(false)}
                title={
                  confirmingReset
                    ? "Click again to clear the whole plan"
                    : "Start again with a blank tank"
                }
                className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmingReset ? "border-destructive bg-destructive text-destructive-foreground hover:brightness-95" : "bg-card text-foreground hover:bg-muted"}`}
              >
                <RotateCcw className="h-4 w-4" />
                {confirmingReset ? "Sure?" : "Reset"}
              </button>
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
              {!visualiser && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={!hasFish}
                    title={hasFish ? "Download or print this plan" : "Add fish to export a plan"}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Export
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItem
                      disabled={scorecard.overall === null}
                      onSelect={shareCard}
                      className="items-start gap-2 py-2"
                    >
                      <ImageDown className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <span className="block font-medium">Score card image (PNG)</span>
                        <span className="block text-xs text-muted-foreground">
                          Your score and top issues, sized to share
                        </span>
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => window.print()}
                      className="items-start gap-2 py-2"
                    >
                      <Printer className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <span className="block font-medium">Print one-page plan</span>
                        <span className="block text-xs text-muted-foreground">
                          Fish list and checks to take to the shop
                        </span>
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          {loadError || catalogError ? (
            <div role="alert" className="planner-error">
              <h3>Couldn't load {loadError ? "this tank" : "the fish and equipment lists"}.</h3>
              <p>Your existing draft is still on this device. Reload to try again.</p>
              <button onClick={() => window.location.reload()}>Try again</button>
            </div>
          ) : !ready || loadingTank ? (
            <div className="min-h-64 flex items-center justify-center gap-3" role="status">
              <Loader2 className="size-5 animate-spin" /> Loading your tank tools…
            </div>
          ) : (
            <>
              <div className={visualiser ? "visualiser-workspace" : "calculator-workspace"}>
                {visualiser && (
                  <Suspense fallback={<p role="status">Loading visualiser…</p>}>
                    <VisualiserCanvas state={state} setState={setState} history={history} />
                  </Suspense>
                )}
                <section className="planner-column" aria-labelledby="tank-heading">
                  <h2 id="tank-heading">{visualiser ? "Plan details" : "1 · Your tank"}</h2>
                  <p className="planner-help">
                    {visualiser
                      ? "Shape the tank and arrange what goes inside it."
                      : "Start with its size."}
                  </p>
                  <TankSetupPanel
                    state={state}
                    setState={setState}
                    species={species.data!}
                    plants={plants.data ?? []}
                    hardscape={hardscape.data ?? []}
                    filters={filters.data!}
                    openSteps={openSteps}
                    setOpenSteps={setOpenSteps}
                    sections={
                      visualiser
                        ? ["tank", "filter", "livestock", "aquascape"]
                        : showAdvanced
                          ? ["tank", "water", "filter"]
                          : ["tank"]
                    }
                    visualOnly={visualiser}
                  />
                  {!visualiser && !showAdvanced && (
                    <p className="mt-3 rounded-xl border border-dashed px-3 py-2 text-xs text-muted-foreground">
                      Water, equipment and filter settings appear here after you add your first
                      fish.
                    </p>
                  )}
                  {visualiser && (
                    <div className="mt-4 border-t border-rule pt-4">
                      <p className="science-label text-muted-foreground">
                        Shrimp, snails and crabs
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add invertebrates to the scene.
                      </p>
                      <div className="mt-3">
                        <InvertebrateAdder
                          state={state}
                          setState={setState}
                          invertebrates={invertebrates.data ?? []}
                        />
                      </div>
                    </div>
                  )}
                </section>
                {!visualiser && (
                  <section id="your-fish" className="planner-column" aria-labelledby="fish-heading">
                    <h2 id="fish-heading">2 · Your fish</h2>
                    <p className="planner-help">Search a species, then adjust its group.</p>
                    <SpeciesAdder state={state} setState={setState} species={species.data!} />
                    <p className="mt-5 text-sm text-muted-foreground">
                      {state.species.length} species ·{" "}
                      {state.species.reduce((n, row) => n + row.quantity, 0)} fish
                    </p>
                    <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                      Water results compare your planned pH and temperature. They do not verify your
                      actual water.
                    </p>
                    <Link to="/species" className="planner-text-link">
                      Explore the fish library →
                    </Link>
                    {showInverts || (state.invertebrates ?? []).length > 0 ? (
                      <div className="mt-6 border-t border-rule pt-5">
                        <p className="science-label text-muted-foreground">
                          Shrimp, snails and crabs
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Optional. Checked separately from your score.
                        </p>
                        <div className="mt-3">
                          <InvertebrateAdder
                            state={state}
                            setState={setState}
                            invertebrates={invertebrates.data ?? []}
                          />
                        </div>
                        <InvertebrateChecks state={state} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowInverts(true)}
                        className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        <Plus className="h-4 w-4" aria-hidden /> Add shrimp, snails or crabs
                        (optional)
                      </button>
                    )}
                  </section>
                )}
                {!visualiser && (
                  <section
                    id="your-results"
                    tabIndex={-1}
                    className="planner-column planner-results"
                    aria-labelledby="results-heading"
                  >
                    <h2 id="results-heading">Your results</h2>
                    <p className="planner-help">What fits, and what needs attention.</p>
                    {!hasFish ? (
                      <div className="fishtankr-panel p-5">
                        <p className="science-label text-muted-foreground">How to start</p>
                        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground">
                          <li>Enter your tank size, or keep the example to explore.</li>
                          <li>Search for a fish and add the group you want.</li>
                          <li>Then set your water, equipment and filter.</li>
                        </ol>
                        <p className="mt-3 text-sm text-muted-foreground">
                          Results appear here once you add a fish.
                        </p>
                      </div>
                    ) : (
                      <>
                        {next && <NextActionCard action={next} onOpenSection={openSection} />}
                        {!state.filter && (
                          <p className="planner-notice">
                            Filter details missing. Choose your filter to complete the equipment
                            check.
                          </p>
                        )}
                        <PreStockChecklist
                          scorecard={scorecard}
                          state={state}
                          pendingSave={gate.pendingSave}
                          onCancelSave={gate.cancel}
                          onConfirmSave={() => gate.confirm(doSave)}
                        />
                        <ScorecardPanel
                          scorecard={scorecard}
                          state={state}
                          showPriorityAction={false}
                        />
                        <SetupChecks state={state} />
                        <CompatibleSuggestions
                          state={state}
                          setState={setState}
                          species={species.data!}
                        />
                        <PlanNextSteps
                          name={state.name}
                          savedId={savedId}
                          shareSlug={planShareSlug}
                          saveNow={async () => {
                            const row = await saveTank(state, savedId);
                            setSavedId(row.id);
                            setSavedShareSlug(row.share_slug);
                            return row;
                          }}
                        />
                      </>
                    )}
                    <Link to="/visualiser" search={linkSearch} className="planner-primary">
                      Plan this tank in 3D <span aria-hidden>→</span>
                    </Link>
                    <p className="data-mono text-xs text-muted-foreground">{"\n"}</p>
                  </section>
                )}
              </div>
              {!visualiser && (
                <a className="planner-mobile-results" href="#your-results">
                  View your results <span aria-hidden>↑</span>
                </a>
              )}
              <div className="planner-explore">
                <div>
                  <h3>Find your next freshwater setup.</h3>
                  <p>Start with an example and make it yours.</p>
                </div>
                <Link to="/tank-ideas">Explore Tank Ideas →</Link>
              </div>
            </>
          )}
        </div>
      </main>
      {!visualiser && <TankReport scorecard={scorecard} state={state} />}
      <WorkInProgressBanner />
    </>
  );
}
