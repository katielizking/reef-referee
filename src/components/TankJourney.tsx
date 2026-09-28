import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

export type JourneyStage = "plan" | "save" | "track" | "review";

const STAGES: Array<{ id: JourneyStage; label: string }> = [
  { id: "plan", label: "Plan" },
  { id: "save", label: "Save" },
  { id: "track", label: "Track water" },
  { id: "review", label: "Review changes" },
];

/**
 * Where a tank is in plan → save → track water → review changes. Stages up
 * to `reached` are done; each links to where that stage lives for this tank.
 */
export function TankJourney({
  name,
  reached,
  planSlug,
  trackedId,
}: {
  name: string;
  reached: JourneyStage;
  planSlug?: string | null;
  trackedId?: string | null;
}) {
  const reachedIndex = STAGES.findIndex((s) => s.id === reached);
  const href = (id: JourneyStage) => {
    if ((id === "plan" || id === "save") && planSlug)
      return { to: "/calculator" as const, search: { tank: planSlug } };
    if ((id === "track" || id === "review") && trackedId)
      return { to: "/tracker/$id" as const, params: { id: trackedId } };
    return null;
  };
  return (
    <nav aria-label={`${name}: progress`} className="rounded-2xl border bg-card p-3">
      <p className="px-1 text-xs font-semibold text-foreground">{name}</p>
      <ol className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {STAGES.map((stage, i) => {
          const done = i <= reachedIndex;
          const link = href(stage.id);
          const content = (
            <>
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                aria-hidden
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className={done ? "text-foreground" : "text-muted-foreground"}>
                {stage.label}
              </span>
            </>
          );
          const cls = "flex min-h-9 items-center gap-2 rounded-lg px-2 py-1 text-xs";
          return (
            <li key={stage.id} aria-current={i === reachedIndex ? "step" : undefined}>
              {link ? (
                <Link {...link} className={`${cls} hover:bg-muted`}>
                  {content}
                </Link>
              ) : (
                <span className={cls}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
