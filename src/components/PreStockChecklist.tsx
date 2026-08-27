import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Info,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import type { Issue, Scorecard } from "@/lib/scoring";
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

function issueTitle(issue: Issue): string {
  const titles: Partial<Record<Issue["code"], string>> = {
    "shoal-shortfall": "Group is too small",
    "conspecific-partial-group": "Unsafe partial group",
    "conspecific-aggression": "Same-species aggression",
    "conspecific-territorial": "Territorial group risk",
    "aggression-standing": "Aggression needs active management",
    "both-aggressive": "Two aggressive species",
    "temperament-clash": "Temperament mismatch",
    "both-territorial": "Competing territories",
    "fin-nipping": "Fin-nipping risk",
    "fin-nipping-understocked": "Fin-nipping risk is elevated",
    predation: "Predation risk",
    "ph-no-overlap": "No shared pH range",
    "ph-marginal": "Very narrow shared pH range",
    "temp-no-overlap": "No shared temperature range",
    "temp-marginal": "Very narrow shared temperature range",
    "tank-too-small": "Tank volume is too small",
    "tank-too-short": "Tank is too short",
    "footprint-crowded": "Tank footprint is crowded",
    "ph-unsuitable": "Target pH is unsuitable",
    "temp-unsuitable": "Target temperature is unsuitable",
    "no-filter": "No biological filter selected",
    "no-biological-media": "Biological media is insufficient",
    "filter-not-mature": "Biofilter maturity is unverified",
    "cycle-not-started": "Nitrogen cycle has not started",
    "cycle-in-progress": "Nitrogen cycle is still in progress",
    "cycle-unverified": "Nitrogen cycle is unverified",
    "water-test-stale": "Water-test evidence is out of date",
    "ammonia-detected": "Ammonia detected",
    "nitrite-detected": "Nitrite detected",
  };
  return titles[issue.code] ?? "Care issue";
}

function checklistSeverity(issue: Issue): ChecklistSeverity {
  if (issue.category === "readiness") return "must-fix";
  if (issue.severity === "critical") return "must-fix";
  if (issue.severity === "high" || issue.severity === "medium")
    return "worth-look";
  return "info";
}

export function buildChecklist(
  scorecard: Scorecard,
  state: TankState,
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const scoredIssues: Issue[] = [
    ...scorecard.readiness.issues,
    ...scorecard.compatibility.issues,
    ...(scorecard.space.issues ?? []),
    ...(scorecard.water.issues ?? []),
  ];

  scoredIssues.forEach((issue, index) => {
    items.push({
      id: `${issue.category}:${issue.code}:${index}`,
      severity: checklistSeverity(issue),
      title: issueTitle(issue),
      why: issue.reason,
      fix: issue.fix,
    });
  });

  if (scorecard.bioload.loadBand === "very-high") {
    items.push({
      id: "waste-load-very-high",
      severity: "worth-look",
      title: "Very high preliminary waste-load flag",
      why: "The experimental screen is high enough to justify a closer stocking review, but it is not a validated capacity percentage.",
      fix:
        scorecard.bioload.fixes[0] ??
        "Review adult fish needs and water-test trends before adding livestock.",
    });
  } else if (scorecard.bioload.loadBand === "high") {
    items.push({
      id: "waste-load-high",
      severity: "worth-look",
      title: "High preliminary waste-load flag",
      why: "This beta screen suggests reviewing the plan; it does not calculate how many fish the tank can safely hold.",
      fix:
        scorecard.bioload.fixes[0] ??
        "Review the plan against adult fish needs and measured water quality.",
    });
  }

  if (
    state.maintenance_frequency === "monthly" &&
    (scorecard.bioload.loadBand === "high" ||
      scorecard.bioload.loadBand === "very-high")
  ) {
    items.push({
      id: "maint-thin",
      severity: "worth-look",
      title: "Monthly maintenance is thin for this stocking",
      why: "Nitrate and dissolved waste may build up faster than monthly water changes can remove them.",
      fix: "Switch to fortnightly or weekly water changes.",
    });
  }

  if (
    state.filter &&
    state.filter.rated_litres <
      (state.length_cm * state.width_cm * state.height_cm) / 1000
  ) {
    items.push({
      id: "filter-manufacturer-rating",
      severity: "worth-look",
      title: "Filter is below the tank’s manufacturer rating",
      why: "The selected filter is marketed for a smaller aquarium. Its flow rate alone does not prove biological capacity.",
      fix: "Choose a filter rated for this tank or larger, then verify its media and cycle maturity separately.",
    });
  }

  if (scorecard.biome.score < 50 && state.species.length > 1) {
    items.push({
      id: "mixed-biotope",
      severity: "info",
      title: "Mixed-region community",
      why: "This is not a strict biotope, which is a style choice rather than a welfare failure.",
      fix: "Leave it mixed, or choose one region if you want a more authentic biotope display.",
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

export function PreStockChecklist({
  scorecard,
  state,
  pendingSave,
  onCancelSave,
  onConfirmSave,
}: Props) {
  const items = useMemo(
    () => buildChecklist(scorecard, state),
    [scorecard, state],
  );
  const mustFix = items.filter((i) => i.severity === "must-fix");
  const worthLook = items.filter((i) => i.severity === "worth-look");
  const info = items.filter((i) => i.severity === "info");
  const [open, setOpen] = useState(mustFix.length > 0 || worthLook.length > 0);
  const [guardOn, setGuardOn] = useGuard();

  useEffect(() => {
    if (mustFix.length > 0 || worthLook.length > 0) setOpen(true);
  }, [mustFix.length, worthLook.length]);

  const noFish = state.species.length === 0;

  return (
    <>
      <section className="rounded-3xl border bg-card p-4">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold text-foreground">
                Pre-stock check
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <CountBadges
                mustFix={mustFix.length}
                worthLook={worthLook.length}
                noFish={noFish}
              />
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-2">
            {items.length === 0 && noFish ? (
              <p className="rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Cycle readiness is recorded. Add fish to run compatibility,
                space and water checks.
              </p>
            ) : items.length === 0 ? (
              <p className="rounded-xl bg-lime/20 px-3 py-2 text-sm text-foreground">
                Looking good — no risks flagged. Remember this is a guide, not a
                guarantee.
              </p>
            ) : (
              <>
                {mustFix.map((it) => (
                  <ItemRow key={it.id} item={it} />
                ))}
                {worthLook.map((it) => (
                  <ItemRow key={it.id} item={it} />
                ))}
                {info.map((it) => (
                  <ItemRow key={it.id} item={it} />
                ))}
              </>
            )}

            <div className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Skip this check
                </p>
                <p className="text-xs text-muted-foreground">
                  Turn off if you know what you're doing. Save won't ask you to
                  confirm.
                </p>
              </div>
              <Switch
                checked={!guardOn}
                onCheckedChange={(v) => setGuardOn(!v)}
                aria-label="Skip pre-stock check"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      <AlertDialog
        open={pendingSave !== null}
        onOpenChange={(o) => {
          if (!o) onCancelSave();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-coral" />
              Worth another look before you save
            </AlertDialogTitle>
            <AlertDialogDescription>
              This setup has issues that will affect your fish. You can adjust
              the tank, or save anyway if it's intentional.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-[50vh] space-y-2 overflow-auto">
            {mustFix.map((it) => (
              <ItemRow key={it.id} item={it} />
            ))}
            {worthLook.length > 0 && (
              <>
                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Also worth a look
                </p>
                {worthLook.map((it) => (
                  <ItemRow key={it.id} item={it} />
                ))}
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelSave}>
              Adjust tank
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmSave}
              className="bg-coral text-white hover:bg-coral/90"
            >
              Save anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CountBadges({
  mustFix,
  worthLook,
  noFish,
}: {
  mustFix: number;
  worthLook: number;
  noFish: boolean;
}) {
  if (noFish && mustFix === 0 && worthLook === 0)
    return <span className="text-xs text-muted-foreground">No fish yet</span>;
  if (mustFix === 0 && worthLook === 0) {
    return (
      <span className="rounded-full bg-lime/30 px-2 py-0.5 text-xs font-semibold text-foreground">
        All clear
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs">
      {mustFix > 0 && (
        <span className="rounded-full bg-coral/25 px-2 py-0.5 font-semibold text-foreground">
          {mustFix} must fix
        </span>
      )}
      {worthLook > 0 && (
        <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground">
          {worthLook} look
        </span>
      )}
    </span>
  );
}

function ItemRow({ item }: { item: ChecklistItem }) {
  const styles =
    item.severity === "must-fix"
      ? {
          bg: "bg-coral/10",
          icon: <TriangleAlert className="h-4 w-4 text-coral" />,
        }
      : item.severity === "worth-look"
        ? {
            bg: "bg-muted/60",
            icon: <AlertTriangle className="h-4 w-4 text-foreground/70" />,
          }
        : {
            bg: "bg-muted/40",
            icon: <Info className="h-4 w-4 text-muted-foreground" />,
          };
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
  const items = useMemo(
    () => buildChecklist(scorecard, state),
    [scorecard, state],
  );
  const mustFix = items.filter((i) => i.severity === "must-fix");
  const [pendingSave, setPendingSave] = useState<null | { share: boolean }>(
    null,
  );

  const guardOn =
    typeof window !== "undefined"
      ? window.localStorage.getItem(GUARD_KEY) !== "off"
      : true;

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
