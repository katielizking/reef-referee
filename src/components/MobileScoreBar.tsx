import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScorecardPanel } from "@/components/Scorecard";
import type { Scorecard } from "@/lib/scoring";
import { WelfareVerdictCard } from "@/components/WelfareVerdictCard";
import { welfareVerdictFor } from "@/lib/welfare-verdict";
import { ChevronUp } from "lucide-react";

export function MobileWelfareSummary({ scorecard }: { scorecard: Scorecard }) {
  return (
    <div className="lg:hidden">
      <WelfareVerdictCard scorecard={scorecard} compact />
    </div>
  );
}

/**
 * Sticky bottom score bar shown on small screens so the user always sees
 * how their tank is scoring without scrolling to the bottom. Tapping
 * opens the full scorecard in a sheet.
 */
export function MobileScoreBar({ scorecard }: { scorecard: Scorecard }) {
  const [open, setOpen] = useState(false);
  const verdict = welfareVerdictFor(scorecard);
  const { Icon } = verdict;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Tank score ${scorecard.overall ?? "not ready"}. Open scorecard.`}
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-card px-4 py-3 shadow-float lg:hidden"
        >
          <div className="flex items-center gap-3">
            <div
              className="data-mono flex size-11 items-center justify-center rounded-full bg-ink text-base font-semibold text-on-ink shadow-panel"
              aria-hidden
            >
              {scorecard.overall ?? "-"}
            </div>
            <div className="text-left">
              <div
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-foreground"
                style={{ background: `color-mix(in srgb, ${verdict.accent} 18%, transparent)` }}
              >
                <Icon className="h-3 w-3" aria-hidden />
                {verdict.label}
              </div>
              <p className="text-xs text-muted-foreground">
                {scorecard.priorityAction?.title ?? verdict.summary}
              </p>
            </div>
          </div>
          <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[min(85dvh,44rem)] overflow-y-auto rounded-t-[1.5rem] pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader>
          <SheetTitle>Tank score</SheetTitle>
        </SheetHeader>
        <div className="pt-4">
          <ScorecardPanel scorecard={scorecard} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
