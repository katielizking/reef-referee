import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { TankRow } from "@/lib/types";
import { useStartTracking, useTrackedTankForPlan } from "@/lib/tank-journey";
import { TankJourney } from "@/components/TankJourney";

/**
 * The end of the calculator results: where this plan goes next. Both actions
 * save the current plan first, so the community post and the tracker always
 * show the plan as it is now, under the same name.
 */
export function PlanNextSteps({
  name,
  savedId,
  shareSlug,
  saveNow,
}: {
  name: string;
  savedId?: string;
  shareSlug?: string;
  saveNow: () => Promise<TankRow>;
}) {
  const navigate = useNavigate();
  const tracked = useTrackedTankForPlan(savedId);
  const startTracking = useStartTracking();
  const [busy, setBusy] = useState<"ask" | "track" | null>(null);

  async function run(kind: "ask" | "track") {
    setBusy(kind);
    try {
      const row = await saveNow();
      if (kind === "ask") {
        await navigate({ to: "/community/new", search: { plan: row.share_slug } });
      } else {
        const tank = await startTracking.mutateAsync(row);
        toast.success(`Tracking ${row.name}`, {
          description: "Log your first water test to see whether it is ready for fish.",
        });
        await navigate({ to: "/tracker/$id", params: { id: tank.id } });
      }
    } catch (error) {
      toast.error(kind === "ask" ? "Couldn't open a post" : "Couldn't start tracking", {
        description:
          error instanceof Error ? error.message : "Save the plan first, then try again.",
      });
    } finally {
      setBusy(null);
    }
  }

  const trackedId = tracked.data?.id;
  return (
    <section aria-labelledby="next-steps-heading" className="fishtankr-panel space-y-3 p-5">
      <h3 id="next-steps-heading" className="font-display text-lg font-semibold text-foreground">
        Next steps for this tank
      </h3>
      <TankJourney
        name={name}
        reached={trackedId ? "track" : savedId ? "save" : "plan"}
        planSlug={shareSlug}
        trackedId={trackedId}
      />
      <div className="grid gap-2">
        {trackedId ? (
          <Link
            to="/tracker/$id"
            params={{ id: trackedId }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <Droplets className="h-4 w-4" aria-hidden /> Open this tank's water log
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void run("track")}
            disabled={busy !== null}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
          >
            {busy === "track" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Droplets className="h-4 w-4" aria-hidden />
            )}
            Set up this tank and track its water
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        This saves the plan first, so your water log shows it as it is now.
      </p>
    </section>
  );
}
