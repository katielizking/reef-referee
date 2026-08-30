import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScorecardPanel } from "@/components/Scorecard";
import type { Scorecard } from "@/lib/scoring";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronUp } from "lucide-react";

function toneFor(overall: number | null, capReason: string | null) {
  if (overall === null)
    return {
      label: "No score yet",
      sub: "Add fish to see your score",
      bg: "bg-muted",
      chip: "bg-background text-muted-foreground border",
      Icon: AlertCircle,
    };
  if (overall < 45)
    return {
      label: "Do not stock",
      sub: "Resolve the critical concern",
      bg: "bg-coral/15",
      chip: "bg-coral/20 text-foreground",
      Icon: AlertTriangle,
    };
  if (overall < 75 || capReason)
    return {
      label: "Risky — revise first",
      sub: "Resolve welfare concerns",
      bg: "bg-warn/15",
      chip: "bg-warn/20 text-foreground",
      Icon: AlertCircle,
    };
  return {
    label: "Safe to consider",
    sub: "Keep monitoring fish and water",
    bg: "bg-lime/20",
    chip: "bg-lime/30 text-foreground",
    Icon: CheckCircle2,
  };
}

export function MobileWelfareSummary({ scorecard }: { scorecard: Scorecard }) {
  const tone = toneFor(scorecard.overall, scorecard.capReason);
  const Icon = tone.Icon;
  return (
    <section
      className={`fishtankr-panel rounded-[1.5rem] border-l-4 p-4 lg:hidden ${scorecard.overall !== null && scorecard.overall < 45 ? "border-l-coral" : scorecard.capReason ? "border-l-warn" : "border-l-primary"}`}
      aria-label="Current welfare verdict"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="science-label text-primary">Welfare verdict</p>
          <p className="mt-1 flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <Icon className="h-5 w-5" aria-hidden />
            {tone.label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {scorecard.priorityAction?.action ?? tone.sub}
          </p>
        </div>
        <span
          className="rounded-full bg-muted px-3 py-2 font-display text-lg font-bold text-foreground"
          aria-label={
            scorecard.overall === null ? "No score yet" : `Score ${scorecard.overall} out of 100`
          }
        >
          {scorecard.overall ?? "—"}
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold text-primary">
        Open the score bar below for reasons and fixes.
      </p>
    </section>
  );
}

/**
 * Sticky bottom score bar shown on small screens so the user always sees
 * how their tank is scoring without scrolling to the bottom. Tapping
 * opens the full scorecard in a sheet.
 */
export function MobileScoreBar({ scorecard }: { scorecard: Scorecard }) {
  const [open, setOpen] = useState(false);
  const tone = toneFor(scorecard.overall, scorecard.capReason);
  const Icon = tone.Icon;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Overall score ${scorecard.overall ?? "not yet available"}. Tap to view full scorecard.`}
          className={`fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-[0_12px_35px_rgba(18,35,46,.18)] shadow-lg lg:hidden ${tone.bg}`}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-base font-semibold text-foreground shadow-sm"
              aria-hidden
            >
              {scorecard.overall ?? "—"}
            </div>
            <div className="text-left">
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.chip}`}
              >
                <Icon className="h-3 w-3" aria-hidden />
                {tone.label}
              </div>
              <p className="text-xs text-muted-foreground">{tone.sub}</p>
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
          <SheetTitle>Scorecard</SheetTitle>
        </SheetHeader>
        <div className="pt-4">
          <ScorecardPanel scorecard={scorecard} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
