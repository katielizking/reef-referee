import { Check } from "lucide-react";
import type { TankState } from "@/lib/types";

export type StepId = "tank" | "filter" | "livestock" | "aquascape";

const STEPS: Array<{ id: StepId; label: string; sub: string }> = [
  { id: "tank", label: "Tank", sub: "Size & water" },
  { id: "filter", label: "Filter", sub: "Filter & upkeep" },
  { id: "livestock", label: "Fish", sub: "Build a community" },
  { id: "aquascape", label: "Aquascape", sub: "Plants & habitat" },
];

const MIN_DIM = 10;

export function stepStatus(state: TankState): Record<StepId, boolean> {
  return {
    tank: state.length_cm >= MIN_DIM && state.width_cm >= MIN_DIM && state.height_cm >= MIN_DIM,
    filter: state.filter !== null && state.biological_media_level !== "minimal",
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
  const completed = STEPS.filter((step) => status[step.id]).length;
  const currentIdx = Math.max(
    0,
    STEPS.findIndex((step) => !status[step.id]),
  );
  const progress = Math.round((completed / STEPS.length) * 100);

  return (
    <nav
      aria-label="Builder progress"
      className="mb-4 overflow-hidden rounded-2xl bg-ink text-on-ink shadow-float sm:mb-5"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
        <div>
          <p className="science-label text-blue">Tank plan</p>
          <p className="mt-1 text-ui-caption text-on-ink-muted">
            Step {Math.min(currentIdx + 1, STEPS.length)} of {STEPS.length} · {completed} complete
          </p>
        </div>
        <div className="flex min-w-[5rem] items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-lime transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="data-mono text-ui-caption font-semibold text-lime">{progress}%</span>
        </div>
      </div>
      <ol className="grid grid-cols-4 gap-1 p-2 sm:gap-2 sm:p-3">
        {STEPS.map((step, index) => {
          const done = status[step.id];
          const current = index === currentIdx;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onJump(step.id)}
                aria-current={current ? "step" : undefined}
                aria-label={`${step.label}. ${done ? "Complete" : current ? "Current step" : step.sub}`}
                className={`group flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center transition-[background-color,color,box-shadow,transform] duration-200 ease-out sm:flex-row sm:justify-start sm:gap-3 sm:px-3 sm:py-3 sm:text-left ${
                  current
                    ? "bg-white text-ink shadow-panel"
                    : done
                      ? "text-on-ink hover:bg-white/10"
                      : "text-on-ink-muted hover:bg-white/5 hover:text-on-ink"
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-ui-caption font-bold transition-colors sm:size-8 ${
                    done
                      ? "border-lime bg-lime text-ink"
                      : current
                        ? "border-blue bg-blue text-white"
                        : "border-white/20 text-on-ink-muted"
                  }`}
                  aria-hidden
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-sm font-semibold">
                    {step.label}
                  </span>
                  <span
                    className={`hidden truncate text-ui-caption sm:block ${current ? "text-ink/65" : "text-on-ink-muted"}`}
                  >
                    {done ? "Ready" : step.sub}
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
