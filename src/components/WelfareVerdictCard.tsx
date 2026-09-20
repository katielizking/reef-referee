import type { Scorecard } from "@/lib/scoring";
import { welfareVerdictFor } from "@/lib/welfare-verdict";

export function WelfareVerdictCard({
  scorecard,
  compact = false,
}: {
  scorecard: Scorecard;
  compact?: boolean;
}) {
  const verdict = welfareVerdictFor(scorecard);
  const { Icon } = verdict;

  return (
    <section
      className={`fishtankr-panel overflow-hidden border-l-4 ${compact ? "p-4" : "p-5 sm:p-6"}`}
      style={{ borderLeftColor: verdict.accent }}
      aria-label="Welfare check"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="science-label text-primary">Welfare check</p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `color-mix(in srgb, ${verdict.accent} 16%, transparent)`,
                color: verdict.accent,
              }}
              aria-hidden
            >
              <Icon className="size-4" />
            </span>
            <p
              className={`${compact ? "text-xl" : "text-2xl"} font-display font-bold tracking-tight text-foreground`}
            >
              {verdict.label}
            </p>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{verdict.summary}</p>
        </div>
        <div
          className="flex min-h-16 min-w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-ink px-3 text-on-ink shadow-panel"
          aria-label={
            scorecard.overall === null
              ? "No welfare score yet"
              : `Welfare score ${scorecard.overall} out of 100`
          }
        >
          <span className="data-mono text-2xl font-semibold leading-none">
            {scorecard.overall ?? "-"}
          </span>
          <span className="data-mono mt-1 text-[10px] uppercase tracking-[0.12em] text-on-ink-muted">
            /100
          </span>
        </div>
      </div>

      {scorecard.priorityAction && (
        <div className="mt-4 border-t border-rule pt-4">
          <p className="data-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Fix this first · {scorecard.priorityAction.category}
          </p>
          <p className="mt-1 font-display text-base font-semibold text-foreground">
            {scorecard.priorityAction.title}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {scorecard.priorityAction.action}
          </p>
        </div>
      )}

      {scorecard.capReason && (
        <p
          className="mt-4 border-l-2 pl-3 text-sm leading-6 text-foreground"
          style={{ borderColor: "var(--status-caution)" }}
        >
          {scorecard.capReason}
        </p>
      )}
    </section>
  );
}
