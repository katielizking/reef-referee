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
      label: "Not recommended",
      sub: "Tap for details",
      bg: "bg-coral/15",
      chip: "bg-coral/20 text-foreground",
      Icon: AlertTriangle,
    };
  if (overall < 75 || capReason)
    return {
      label: "Worth another look",
      sub: "Tap for details",
      bg: "bg-warn/15",
      chip: "bg-warn/20 text-foreground",
      Icon: AlertCircle,
    };
  return {
    label: "Looking good",
    sub: "Tap for details",
    bg: "bg-lime/20",
    chip: "bg-lime/30 text-foreground",
    Icon: CheckCircle2,
  };
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
          className={`fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 shadow-lg lg:hidden ${tone.bg}`}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-base font-semibold text-foreground shadow-sm"
              aria-hidden
            >
              {scorecard.overall ?? "—"}
            </div>
            <div className="text-left">
              <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.chip}`}>
                <Icon className="h-3 w-3" aria-hidden />
                {tone.label}
              </div>
              <p className="text-xs text-muted-foreground">{tone.sub}</p>
            </div>
          </div>
          <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85dvh] overflow-y-auto">
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
