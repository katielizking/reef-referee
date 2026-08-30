import { Check } from "lucide-react";
import type { TankState } from "@/lib/types";
import { isWaterTestCurrent } from "@/lib/scoring";

export type StepId = "tank" | "filter" | "livestock" | "aquascape";

const STEPS: Array<{ id: StepId; label: string; sub: string }> = [
  { id: "tank", label: "Tank", sub: "Size & water" },
  { id: "filter", label: "Cycle", sub: "Filter & tests" },
  { id: "livestock", label: "Livestock", sub: "Fish community" },
  { id: "aquascape", label: "Aquascape", sub: "Plants & habitat" },
];

const MIN_DIM = 10;

export function stepStatus(state: TankState): Record<StepId, boolean> {
  return {
    tank: state.length_cm >= MIN_DIM && state.width_cm >= MIN_DIM && state.height_cm >= MIN_DIM,
    filter:
      state.filter !== null &&
      state.biological_media_level !== "minimal" &&
      state.filter_maturity === "established" &&
      state.cycle_status === "verified" &&
      isWaterTestCurrent(state.water_tested_on) &&
      state.ammonia_mg_l === 0 &&
      state.nitrite_mg_l === 0,
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
  const currentIdx = STEPS.findIndex((step) => !status[step.id]);
  const progress = Math.round((completed / STEPS.length) * 100);

  return (
    <nav
      aria-label="Builder progress"
      className="mb-4 overflow-hidden rounded-[1.25rem] sm:mb-5 sm:rounded-[1.5rem] bg-ink text-white shadow-[0_16px_40px_rgba(18,35,46,.16)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:gap-4 sm:px-5">
        <div>
          <p className="science-label text-blue">Tank build</p>
          <p className="mt-1 text-xs text-white/55">
            {completed} of {STEPS.length} foundations set
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-white/10 sm:block">
            <div
              className="h-full rounded-full bg-lime transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-display text-sm font-bold text-lime">{progress}%</span>
        </div>
      </div>
      <ol className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain p-2 [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:overflow-visible">
        {STEPS.map((step, index) => {
          const done = status[step.id];
          const current = index === currentIdx;
          return (
            <li key={step.id} className="min-w-[9.25rem] flex-1 snap-start sm:min-w-0">
              <button
                type="button"
                onClick={() => onJump(step.id)}
                aria-current={current ? "step" : undefined}
                className={`group flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                  current
                    ? "bg-white text-ink shadow-sm"
                    : done
                      ? "text-white hover:bg-white/10"
                      : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                    done
                      ? "border-lime bg-lime text-ink"
                      : current
                        ? "border-blue bg-blue text-white"
                        : "border-white/20 text-white/50"
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
                    className={`block truncate text-[11px] ${current ? "text-ink/55" : "text-white/45"}`}
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
