import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Share2 } from "lucide-react";
import { toast } from "sonner";

import { TankSetupPanel } from "@/components/TankSetupPanel";
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
import type { TankState } from "@/lib/types";
import { useFilters, useHardscape, usePlants, useSpecies, saveTank } from "@/lib/data";



export const Route = createFileRoute("/")({
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
  target_ph: 7.0,
  target_temp_c: 25,
  plant_density: "medium",
  species: [],
  plants: [],
  hardscape: [],
};

function Builder() {
  const [state, setState] = useState<TankState>(DEFAULT_STATE);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  const species = useSpecies();
  const plants = usePlants();
  const hardscape = useHardscape();
  const filters = useFilters();

  const scorecard = useMemo(() => scoreTank(state), [state]);
  const gate = useSaveGate(scorecard, state);
  const history = useTankHistory(state, setState);
  const selected = useEditorStore((s) => s.selected);

  const ready = species.data && plants.data && hardscape.data && filters.data;
  const showHero = state.species.length === 0;

  const dims = useMemo(() => {
    const CM_PER_UNIT = 10;
    const x = Math.max(state.length_cm, 20) / CM_PER_UNIT;
    const y = Math.max(state.height_cm, 20) / CM_PER_UNIT;
    const z = Math.max(state.width_cm, 20) / CM_PER_UNIT;
    const substrateHeight = Math.min(0.4, y * 0.15);
    return { x, y, z, substrateY: -y / 2 + substrateHeight };
  }, [state.length_cm, state.width_cm, state.height_cm]);


  useEffect(() => {
    if (!species.data) return;
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
  }, [species.data]);

  // Auto-suggest a filter once dimensions are known and none is chosen.
  useEffect(() => {
    if (!filters.data || state.filter) return;
    const pick = pickDefaultFilter(filters.data, state);
    if (pick) setState((s) => (s.filter ? s : { ...s, filter: pick }));
  }, [filters.data, state.filter, state.length_cm, state.width_cm, state.height_cm]);


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
    <main className="mx-auto max-w-7xl px-4 py-6 pb-24 lg:pb-6">
      {showHero && (
        <section className="mb-8 grid gap-6 rounded-3xl border bg-card p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-lime/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
              Know before you stock
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Smarter tanks. Happier fish.
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              Plan your setup, check your stocking and understand the biology behind a
              healthy aquarium with simple tools built around fish welfare.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={scrollToBuilder}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-95"
              >
                Check my tank
              </button>
              <button
                onClick={() => navigate({ to: "/saved" })}
                className="inline-flex items-center justify-center rounded-xl border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Explore the tools
              </button>
            </div>
          </div>
          <HeroTankIllustration className="mx-auto w-full max-w-md" />
        </section>
      )}

      <div id="builder" className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Design your tank
          </h2>
          <p className="text-sm text-muted-foreground">
            Add livestock, plants and hardscape. Your scorecard updates as you go.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-95 disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {!ready ? (
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,340px)]">
          <div className="rounded-3xl border bg-card p-5">
            <TankSetupPanel
              state={state}
              setState={setState}
              species={species.data!}
              plants={plants.data!}
              hardscape={hardscape.data!}
              filters={filters.data!}
            />
          </div>
          <div className="space-y-4">
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

            {selected ? (
              <SelectedObjectPanel
                state={state}
                setState={setState}
                interior={dims}
                commit={history.commit}
              />
            ) : (
              <div className="rounded-3xl border bg-card p-4 text-sm text-muted-foreground">
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

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <PreStockChecklist
              scorecard={scorecard}
              state={state}
              pendingSave={gate.pendingSave}
              onCancelSave={gate.cancel}
              onConfirmSave={() => gate.confirm(doSave)}
            />
            <ScorecardPanel scorecard={scorecard} />
          </div>
        </div>
      )}
      {ready && <MobileScoreBar scorecard={scorecard} />}
    </main>

  );
}
