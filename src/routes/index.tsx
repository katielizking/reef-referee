import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Save, Share2 } from "lucide-react";
import { toast } from "sonner";

import { TankSetupPanel } from "@/components/TankSetupPanel";
import { TankVisual } from "@/components/TankVisual";
import { ScorecardPanel } from "@/components/Scorecard";
import { scoreTank } from "@/lib/scoring";
import type { TankState } from "@/lib/types";
import { useFilters, useHardscape, usePlants, useSpecies, saveTank } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fishtankr — Design and score your freshwater tank" },
      {
        name: "description",
        content:
          "Design a freshwater aquarium and get an instant score on stocking, bioload, biotope authenticity and Australian legality.",
      },
    ],
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

  const ready = species.data && plants.data && hardscape.data && filters.data;

  async function handleSave(share = false) {
    try {
      setSaving(true);
      const row = await saveTank(state, savedId);
      setSavedId(row.id);
      if (share) {
        const url = `${window.location.origin}/t/${row.share_slug}`;
        await navigator.clipboard.writeText(url).catch(() => {});
        toast.success("Share link copied to clipboard", { description: url });
      } else {
        toast.success("Tank saved");
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save tank", {
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Design your tank</h1>
          <p className="text-sm text-muted-foreground">
            Add livestock, plants and hardscape. Your scorecard updates instantly.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            onClick={() => navigate({ to: "/saved" })}
            className="hidden rounded-xl border bg-card px-3 py-2 text-sm hover:bg-muted sm:inline-flex"
          >
            Saved tanks
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
            <TankVisual state={state} />
            <div className="rounded-3xl border bg-card p-4 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Tip:</span> Aim for one biotope region
                for a "True biotope" badge, keep bioload comfortably under 100%, and give schooling
                species enough room to shoal.
              </p>
            </div>
          </div>
          <div className="lg:sticky lg:top-4 lg:self-start">
            <ScorecardPanel scorecard={scorecard} />
          </div>
        </div>
      )}
    </main>
  );
}
