import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Info, ShieldCheck, TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import type { Scorecard } from "@/lib/scoring";
import { litresOf } from "@/lib/scoring";
import type { TankState } from "@/lib/types";

const GUARD_KEY = "fishtankr:prestock-guard";

export type ChecklistSeverity = "must-fix" | "worth-look" | "info";

export interface ChecklistItem {
  id: string;
  severity: ChecklistSeverity;
  title: string;
  why: string;
  fix: string;
}

export function buildChecklist(scorecard: Scorecard, state: TankState): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Must-fix — prohibited species
  for (const name of scorecard.legality.illegalSpecies) {
    items.push({
      id: `illegal:${name}`,
      severity: "must-fix",
      title: `${name} is prohibited in Australia`,
      why: "Restricted noxious species can't be legally kept in home aquariums.",
      fix: "Remove this species and pick a permitted alternative from the same biotope.",
    });
  }

  // Must-fix — predation
  for (const conflict of scorecard.compatibility.criticalConflicts) {
    items.push({
      id: `predation:${conflict}`,
      severity: "must-fix",
      title: "Predation risk",
      why: conflict,
      fix: "Rehome the predator, or replace its tank mates with fish it can't fit in its mouth.",
    });
  }

  // Must-fix — overstocked
  if (scorecard.bioload.loadPercent > 110) {
    items.push({
      id: "overstocked",
      severity: "must-fix",
      title: `Overstocked at ${Math.round(scorecard.bioload.loadPercent)}%`,
      why: "Filtration and water changes won't keep pace with the waste this stocking produces.",
      fix: "Reduce fish counts, upgrade the filter, or move to a larger tank before adding more.",
    });
  } else if (scorecard.bioload.loadPercent > 90) {
    items.push({
      id: "near-capacity",
      severity: "worth-look",
      title: `Close to capacity (${Math.round(scorecard.bioload.loadPercent)}%)`,
      why: "You're near the limit for this filter and maintenance schedule.",
      fix: "Hold off on adding more fish, or step up to weekly water changes.",
    });
  }

  // Worth-look — maintenance thin for stocking
  if (state.maintenance_frequency === "monthly" && scorecard.bioload.loadPercent > 60) {
    items.push({
      id: "maint-thin",
      severity: "worth-look",
      title: "Monthly maintenance is thin for this stocking",
      why: "Nitrate and organics build up faster than monthly water changes can clear them.",
      fix: "Switch to fortnightly or weekly water changes.",
    });
  }

  // Worth-look — filter turnover
  const litres = litresOf(state);
  if (state.filter && litres > 0) {
    const turnover = state.filter.turnover_lph / litres;
    if (turnover < 4) {
      items.push({
        id: "filter-undersized",
        severity: "worth-look",
        title: `Filter turnover is only ${turnover.toFixed(1)}× per hour`,
        why: "Most freshwater tanks want 4–6× tank volume per hour of filter flow.",
        fix: "Pick a filter rated for a larger tank, or add a second filter.",
      });
    }
  } else if (!state.filter && state.species.length > 0) {
    items.push({
      id: "no-filter",
      severity: "must-fix",
      title: "No filter selected",
      why: "A tank with fish needs biological filtration — the bacteria in the filter keep the water safe.",
      fix: "Pick a filter rated for your tank volume.",
    });
  }

  // Worth-look — space
  if (scorecard.space.score < 60 && scorecard.space.reasons.length > 0) {
    items.push({
      id: "space",
      severity: "worth-look",
      title: "Not enough space",
      why: scorecard.space.reasons[0],
      fix: scorecard.space.fixes[0] ?? "Reduce active swimmers or move to a longer tank.",
    });
  }

  // Worth-look — biome mixing
  if (scorecard.biome.score < 50 && state.species.length > 1) {
    items.push({
      id: "mixed-biome",
      severity: "worth-look",
      title: "Mixed biotope",
      why: "Species from different regions want different water and won't all thrive together.",
      fix: "Pick a single region and stock around it for a stronger biome score.",
    });
  }

  // Worth-look — schooling shortfalls
  for (const { species, quantity } of state.species) {
    if (species.is_schooling && quantity < species.min_group_size) {
      items.push({
        id: `school:${species.id}`,
        severity: "worth-look",
        title: `${species.common_name} needs a bigger group`,
        why: `Schooling species; keeping ${quantity} causes chronic stress.`,
        fix: `Add at least ${species.min_group_size - quantity} more to reach ${species.min_group_size}.`,
      });
    }
  }

  // Info — native permit notes
  for (const note of scorecard.legality.nativeNotes) {
    items.push({
      id: `native:${note}`,
      severity: "info",
      title: "Australian native — check your state's rules",
      why: note,
      fix: "Confirm your state's fisheries permit requirements before you buy.",
    });
  }

  return items;
}

function useGuard() {
  const [guardOn, setGuardOn] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = window.localStorage.getItem(GUARD_KEY);
    if (v === "off") setGuardOn(false);
  }, []);
  const set = (v: boolean) => {
    setGuardOn(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(GUARD_KEY, v ? "on" : "off");
    }
  };
  return [guardOn, set] as const;
}

interface Props {
  scorecard: Scorecard;
  state: TankState;
  pendingSave: null | { share: boolean };
  onCancelSave: () => void;
  onConfirmSave: () => void;
}

export function PreStockChecklist({ scorecard, state, pendingSave, onCancelSave, onConfirmSave }: Props) {
  const items = useMemo(() => buildChecklist(scorecard, state), [scorecard, state]);
  const mustFix = items.filter((i) => i.severity === "must-fix");
  const worthLook = items.filter((i) => i.severity === "worth-look");
  const info = items.filter((i) => i.severity === "info");
  const [open, setOpen] = useState(mustFix.length > 0);
  const [guardOn, setGuardOn] = useGuard();

  useEffect(() => {
    if (mustFix.length > 0) setOpen(true);
  }, [mustFix.length]);

  const noFish = state.species.length === 0;

  return (
    <>
      <section className="rounded-3xl border bg-card p-4">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold text-foreground">Pre-stock check</h3>
            </div>
            <div className="flex items-center gap-2">
              <CountBadges mustFix={mustFix.length} worthLook={worthLook.length} noFish={noFish} />
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {noFish ? (
              <p className="rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Add fish to run the check.
              </p>
            ) : items.length === 0 ? (
              <p className="rounded-xl bg-lime/20 px-3 py-2 text-sm text-foreground">
                Looking good — no risks flagged. Remember this is a guide, not a guarantee.
              </p>
            ) : (
              <>
                {mustFix.map((it) => <ItemRow key={it.id} item={it} />)}
                {worthLook.map((it) => <ItemRow key={it.id} item={it} />)}
                {info.map((it) => <ItemRow key={it.id} item={it} />)}
              </>
            )}

            <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Skip this check</p>
                <p className="text-xs text-muted-foreground">
                  Turn off if you know what you're doing. Save won't ask you to confirm.
                </p>
              </div>
              <Switch checked={!guardOn} onCheckedChange={(v) => setGuardOn(!v)} aria-label="Skip pre-stock check" />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      <AlertDialog open={pendingSave !== null} onOpenChange={(o) => { if (!o) onCancelSave(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-coral" />
              Worth another look before you save
            </AlertDialogTitle>
            <AlertDialogDescription>
              This setup has issues that will affect your fish. You can adjust the tank, or save anyway if it's intentional.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-[50vh] space-y-2 overflow-auto">
            {mustFix.map((it) => <ItemRow key={it.id} item={it} />)}
            {worthLook.length > 0 && (
              <>
                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Also worth a look</p>
                {worthLook.map((it) => <ItemRow key={it.id} item={it} />)}
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelSave}>Adjust tank</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmSave} className="bg-coral text-white hover:bg-coral/90">
              Save anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CountBadges({ mustFix, worthLook, noFish }: { mustFix: number; worthLook: number; noFish: boolean }) {
  if (noFish) return <span className="text-xs text-muted-foreground">No fish yet</span>;
  if (mustFix === 0 && worthLook === 0) {
    return <span className="rounded-full bg-lime/30 px-2 py-0.5 text-xs font-semibold text-foreground">All clear</span>;
  }
  return (
    <span className="flex items-center gap-1 text-xs">
      {mustFix > 0 && (
        <span className="rounded-full bg-coral/25 px-2 py-0.5 font-semibold text-foreground">{mustFix} must fix</span>
      )}
      {worthLook > 0 && (
        <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground">{worthLook} look</span>
      )}
    </span>
  );
}

function ItemRow({ item }: { item: ChecklistItem }) {
  const styles =
    item.severity === "must-fix"
      ? { bg: "bg-coral/10", icon: <TriangleAlert className="h-4 w-4 text-coral" /> }
      : item.severity === "worth-look"
        ? { bg: "bg-muted/60", icon: <AlertTriangle className="h-4 w-4 text-foreground/70" /> }
        : { bg: "bg-muted/40", icon: <Info className="h-4 w-4 text-muted-foreground" /> };
  return (
    <div className={`rounded-xl px-3 py-2 text-sm ${styles.bg}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{styles.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.why}</p>
          <p className="mt-1 text-xs text-foreground/80">
            <span className="font-medium">Fix:</span> {item.fix}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Save gate hook. Wraps a save function so it checks the guard + must-fix items. */
export function useSaveGate(scorecard: Scorecard, state: TankState) {
  const items = useMemo(() => buildChecklist(scorecard, state), [scorecard, state]);
  const mustFix = items.filter((i) => i.severity === "must-fix");
  const [pendingSave, setPendingSave] = useState<null | { share: boolean }>(null);

  const guardOn = typeof window !== "undefined" ? window.localStorage.getItem(GUARD_KEY) !== "off" : true;

  function requestSave(share: boolean, doSave: (share: boolean) => void) {
    if (guardOn && mustFix.length > 0) {
      setPendingSave({ share });
      return;
    }
    doSave(share);
  }

  return {
    pendingSave,
    requestSave,
    cancel: () => setPendingSave(null),
    confirm: (doSave: (share: boolean) => void) => {
      const share = pendingSave?.share ?? false;
      setPendingSave(null);
      doSave(share);
    },
  };
}
