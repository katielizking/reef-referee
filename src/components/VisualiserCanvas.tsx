import { useMemo } from "react";
import { Fish, Ruler, Waves } from "lucide-react";
import { ClientOnlyTankScene } from "./tank3d/ClientOnlyTankScene";
import { SelectedObjectPanel } from "./tank3d/SelectedObjectPanel";
import { SceneToolbar } from "./tank3d/SceneToolbar";
import { useEditorStore } from "./tank3d/editorStore";
import { EditorOnboarding } from "./EditorOnboarding";
import type { useTankHistory } from "./tank3d/useTankHistory";
import type { TankState } from "@/lib/types";
export default function VisualiserCanvas({
  state,
  setState,
  history,
}: {
  state: TankState;
  setState: (update: (s: TankState) => TankState) => void;
  history: ReturnType<typeof useTankHistory>;
}) {
  const selected = useEditorStore((s) => s.selected);
  const dims = useMemo(() => {
    const CM_PER_UNIT = 10;
    const x = Math.max(state.length_cm, 20) / CM_PER_UNIT;
    const y = Math.max(state.height_cm, 20) / CM_PER_UNIT;
    const z = Math.max(state.width_cm, 20) / CM_PER_UNIT;
    const substrateHeight = Math.min(0.4, y * 0.15);
    return { x, y, z, substrateY: -y / 2 + substrateHeight };
  }, [state.length_cm, state.width_cm, state.height_cm]);

  return (
    <div className="min-w-0 space-y-4">
      <section className="overflow-hidden rounded-[1.5rem] border border-foreground/15 bg-ink p-2 sm:rounded-[2rem] shadow-[0_28px_70px_rgba(18,35,46,.18)] sm:p-3">
        <header className="flex flex-col items-stretch gap-2 px-2 pb-3 pt-1 text-on-ink sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-3">
          <div>
            <p className="science-label text-blue">Live aquarium</p>
            <p className="mt-1 font-display text-sm font-semibold">{state.name}</p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[10px] font-semibold uppercase text-on-ink-muted sm:flex sm:flex-wrap">
            <span className="inline-flex min-w-0 items-center justify-center gap-1 rounded-full bg-on-ink/10 px-2 py-1.5 text-center">
              <Ruler className="h-3 w-3 text-blue" /> {state.length_cm} × {state.width_cm} ×{" "}
              {state.height_cm} cm
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-on-ink/10 px-2.5 py-1.5">
              <Waves className="h-3 w-3 text-blue" />{" "}
              {Math.round((state.length_cm * state.width_cm * state.height_cm) / 1000)} L
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-on-ink/10 px-2.5 py-1.5">
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
              <p className="mt-2 font-display text-base font-bold">Start with your first fish</p>
              <p className="mt-1 text-xs leading-relaxed text-white/75">
                Add fish under Livestock. We’ll set a starting water range and flag what to check.
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
            <span className="font-semibold text-foreground">Tap an item to edit it.</span> Drag to
            move it. Use the panel to rotate, resize, copy or remove it. Undo is in the toolbar.
          </p>
        </div>
      )}
    </div>
  );
}
