import { Link } from "@tanstack/react-router";
import { ClipboardCheck, FlaskConical, type LucideIcon } from "lucide-react";
import { TWO_CHECKS } from "@/lib/two-checks";

type CheckId = "suitability" | "readiness";

const CHECKS: Array<{ id: CheckId; Icon: LucideIcon; to: "/calculator" | "/tracker" }> = [
  { id: "suitability", Icon: ClipboardCheck, to: "/calculator" },
  { id: "readiness", Icon: FlaskConical, to: "/tracker" },
];

/**
 * Stocking suitability and readiness to add fish, side by side. `current`
 * marks the check the page itself performs; the other links to where it lives.
 */
export function TwoChecks({ current }: { current?: CheckId }) {
  return (
    <section aria-label="Two separate checks" className="fishtankr-panel p-5">
      <p className="science-label text-muted-foreground">Two separate checks</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {CHECKS.map(({ id, Icon, to }) => {
          const check = TWO_CHECKS[id];
          const here = id === current;
          return (
            <div
              key={id}
              data-check={id}
              className={`rounded-xl border p-4 ${id === "readiness" ? "border-dashed" : ""} ${here ? "bg-primary/5 border-primary/40" : "bg-background"}`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {check.name}
              </p>
              <p className="mt-1 text-sm text-foreground/85">{check.question}</p>
              <p className="mt-2 text-sm text-muted-foreground">{check.detail}</p>
              <p className="data-mono mt-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {here ? (
                  `${check.where} · this page`
                ) : (
                  <Link to={to} className="font-semibold text-water underline">
                    {check.where} →
                  </Link>
                )}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-foreground">{TWO_CHECKS.reminder}</p>
    </section>
  );
}
