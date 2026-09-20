import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { absoluteUrl } from "@/lib/site";
import {
  CYCLE_STATUS_LABEL,
  MATURITY_LABEL,
  cycleVerdict,
  type CycleStatus,
  type MediaMaturity,
} from "@/lib/cycle-status";
import { useCreateTank, useDeleteTank, useTrackedTanks, useWaterTests } from "@/lib/tracker";

export const Route = createFileRoute("/tracker/")({
  head: () => ({
    meta: [
      { title: "Tank tracker | FishTankr" },
      {
        name: "description",
        content:
          "Track the cycle and water test results for each of your tanks. Log ammonia, nitrite and nitrate and see whether the tank is safe for fish.",
      },
      { property: "og:title", content: "Tank tracker | FishTankr" },
      {
        property: "og:description",
        content: "Log water tests for each tank and see whether the cycle is finished.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/tracker") }],
  }),
  component: TrackerPage,
});

const STATUS_OPTIONS: CycleStatus[] = ["not_started", "cycling", "verified", "unknown"];
const MATURITY_OPTIONS: MediaMaturity[] = ["new", "maturing", "established", "unknown"];

function TrackerPage() {
  const tanks = useTrackedTanks();
  const create = useCreateTank();
  const remove = useDeleteTank();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [litres, setLitres] = useState("");
  const [status, setStatus] = useState<CycleStatus>("cycling");
  const [maturity, setMaturity] = useState<MediaMaturity>("new");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      {
        name: name.trim().slice(0, 120),
        litres: litres ? Number(litres) : null,
        tank_age_weeks: null,
        cycle_status: status,
        cycle_method: "unknown",
        filter_maturity: maturity,
        biological_media_level: "standard",
        seeded_media: false,
      },
      {
        onSuccess: () => {
          toast.success(`${name.trim()} added`);
          setName("");
          setLitres("");
          setAdding(false);
        },
        onError: (error) =>
          toast.error("Couldn't add this tank", {
            description: error instanceof Error ? error.message : "Try again in a moment.",
          }),
      },
    );
  }

  return (
    <main className="planner-surface">
      <div className="planner-container">
        <header className="planner-heading">
          <div>
            <p className="planner-eyebrow">TANK TRACKER</p>
            <h2>Keep an eye on your water.</h2>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Cycling and water tests live here, not in the stocking calculator. Add a tank, log
              each test, and see whether it is safe to add fish.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-95"
          >
            <Plus className="h-4 w-4" /> Add a tank
          </button>
        </header>

        {adding && (
          <form onSubmit={submit} className="fishtankr-panel mb-6 space-y-3 p-5">
            <p className="science-label text-muted-foreground">New tank</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Tank name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  placeholder="Living room 120"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Volume in litres</span>
                <input
                  value={litres}
                  onChange={(e) => setLitres(e.target.value)}
                  type="number"
                  min={1}
                  className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  placeholder="120"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Cycle</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CycleStatus)}
                  className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {CYCLE_STATUS_LABEL[v]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Filter media</span>
                <select
                  value={maturity}
                  onChange={(e) => setMaturity(e.target.value as MediaMaturity)}
                  className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                >
                  {MATURITY_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {MATURITY_LABEL[v]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save tank
            </button>
          </form>
        )}

        {tanks.isLoading ? (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your tanks…
          </p>
        ) : tanks.isError ? (
          <div role="alert" className="planner-error">
            <h3>Couldn't load your tanks.</h3>
            <p>Reload to try again.</p>
          </div>
        ) : (tanks.data ?? []).length === 0 ? (
          <div className="fishtankr-panel p-5">
            <p className="text-sm font-semibold text-foreground">No tanks tracked yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first tank, then log a test each time you check the water.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {(tanks.data ?? []).map((tank) => (
              <TankRow
                key={tank.id}
                id={tank.id}
                name={tank.name}
                litres={tank.litres}
                cycle_status={tank.cycle_status}
                filter_maturity={tank.filter_maturity}
                onDelete={() =>
                  remove.mutate(tank.id, {
                    onSuccess: () => toast.success(`${tank.name} removed`),
                  })
                }
              />
            ))}
          </ul>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          Planning the fish instead?{" "}
          <Link to="/calculator" className="font-semibold text-water underline">
            Open the stocking calculator
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

function TankRow({
  id,
  name,
  litres,
  cycle_status,
  filter_maturity,
  onDelete,
}: {
  id: string;
  name: string;
  litres: number | null;
  cycle_status: CycleStatus;
  filter_maturity: MediaMaturity;
  onDelete: () => void;
}) {
  const tests = useWaterTests(id);
  const latest = (tests.data ?? [])[0] ?? null;
  const verdict = cycleVerdict({ cycle_status, filter_maturity }, latest);
  const colour =
    verdict.severity === "critical"
      ? "var(--verdict-critical)"
      : verdict.severity === "caution"
        ? "var(--verdict-caution)"
        : "var(--verdict-good)";

  return (
    <li className="fishtankr-panel p-5" style={{ borderLeft: `3px solid ${colour}` }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/tracker/$id"
            params={{ id }}
            className="text-base font-semibold text-foreground underline decoration-1 underline-offset-4"
          >
            {name}
          </Link>
          <p className="data-mono mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {litres ? `${litres} L · ` : ""}
            {verdict.label}
            {latest ? ` · last test ${latest.tested_on}` : " · no tests yet"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{verdict.action}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Remove ${name}`}
          className="inline-flex size-11 items-center justify-center rounded-xl border text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
