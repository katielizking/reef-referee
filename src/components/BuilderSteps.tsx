import { Check } from "lucide-react";
import type { TankState } from "@/lib/types";

export type StepId = "tank" | "filter" | "livestock" | "aquascape";

const STEPS: Array<{ id: StepId; label: string; sub: string }> = [
  { id: "tank", label: "Set tank", sub: "Size & water" },
  { id: "filter", label: "Pick filter", sub: "Flow & care" },
  { id: "livestock", label: "Add livestock", sub: "Choose fish" },
  { id: "aquascape", label: "Aquascape", sub: "Plants & décor" },
];

const MIN_DIM = 10;

export function stepStatus(state: TankState): Record<StepId, boolean> {
  return {
    tank:
      state.length_cm >= MIN_DIM &&
      state.width_cm >= MIN_DIM &&
      state.height_cm >= MIN_DIM,
    filter: state.filter !== null,
    livestock: state.species.length > 0,
    aquascape: state.plants.length + state.hardscape.length > 0,
  };
}

interface Props {
  state: TankState;
  onJump: (id: StepId) => void;
}

export function BuilderSteps({ state, onJump }: Props) {
  const status = stepStatus(state);
  // The current step is the first incomplete one.
  const currentIdx = STEPS.findIndex((s) => !status[s.id]);

  return (
    <nav aria-label="Builder progress" className="mb-4">
      <ol className="flex snap-x gap-2 overflow-x-auto rounded-2xl border bg-card p-2 sm:grid sm:grid-cols-4 sm:overflow-visible">
        {STEPS.map((s, i) => {
          const done = status[s.id];
          const current = i === currentIdx;
          return (
            <li key={s.id} className="min-w-[10rem] flex-1 snap-start sm:min-w-0">
              <button
                type="button"
                onClick={() => onJump(s.id)}
                aria-current={current ? "step" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                  done
                    ? "bg-lime/20 text-foreground"
                    : current
                      ? "bg-primary/10 text-foreground ring-1 ring-primary/40"
                      : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? "bg-lime text-foreground"
                      : current
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                  aria-hidden
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {s.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {s.sub}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
