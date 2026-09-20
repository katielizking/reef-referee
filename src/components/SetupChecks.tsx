import { AlertTriangle, Info } from "lucide-react";
import { checkSetup, type SetupSeverity } from "@/lib/setup-check";
import type { TankState } from "@/lib/types";

const HEADING: Record<SetupSeverity, string> = {
  critical: "Fix first",
  caution: "Worth changing",
  note: "Good to know",
};

export function SetupChecks({ state }: { state: TankState }) {
  const issues = checkSetup(state);
  if (issues.length === 0) return null;

  const groups: SetupSeverity[] = ["critical", "caution", "note"];

  return (
    <section className="fishtankr-panel">
      <h2 className="fishtankr-panel-title">
        Substrate and equipment
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          checked separately from the score
        </span>
      </h2>
      <div className="space-y-4">
        {groups.map((severity) => {
          const rows = issues.filter((i) => i.severity === severity);
          if (rows.length === 0) return null;
          return (
            <div key={severity}>
              <p
                className={`mb-1.5 text-xs font-semibold uppercase tracking-wide ${
                  severity === "critical" ? "text-coral" : "text-muted-foreground"
                }`}
              >
                {HEADING[severity]}
              </p>
              <ul className="space-y-2">
                {rows.map((issue) => (
                  <li
                    key={issue.code}
                    className={`flex gap-2 border-l-2 pl-3 text-sm ${
                      severity === "critical" ? "border-coral" : "border-border"
                    }`}
                  >
                    {severity === "critical" ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral" aria-hidden />
                    ) : (
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <span>
                      {issue.reason} <span className="text-muted-foreground">{issue.fix}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
