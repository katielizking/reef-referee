import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  CYCLE_METHOD_LABEL,
  CYCLE_STATUS_LABEL,
  MATURITY_LABEL,
  MEDIA_LEVEL_LABEL,
  cycleVerdict,
  isTestCurrent,
  nitrateNote,
  testAgeDays,
  type CycleMethod,
  type CycleStatus,
  type MediaLevel,
  type MediaMaturity,
  type WaterTest,
} from "@/lib/cycle-status";
import {
  useDeleteTest,
  useLogTest,
  useTrackedTank,
  useUpdateTank,
  useWaterTests,
} from "@/lib/tracker";

export const Route = createFileRoute("/tracker/$id")({
  head: () => ({
    meta: [
      { title: "Tank parameters | FishTankr" },
      {
        name: "description",
        content: "Cycle status and water test history for one of your tracked tanks.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackedTankPage,
});

const TODAY = () => new Date().toISOString().slice(0, 10);

function TrackedTankPage() {
  const { id } = Route.useParams();
  const tank = useTrackedTank(id);
  const tests = useWaterTests(id);
  const update = useUpdateTank(id);
  const log = useLogTest(id);
  const removeTest = useDeleteTest(id);

  const [testedOn, setTestedOn] = useState(TODAY());
  const [ammonia, setAmmonia] = useState("");
  const [nitrite, setNitrite] = useState("");
  const [nitrate, setNitrate] = useState("");
  const [ph, setPh] = useState("");
  const [temp, setTemp] = useState("");
  const [note, setNote] = useState("");

  if (tank.isLoading) {
    return (
      <main className="planner-surface">
        <div className="planner-container">
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading this tank…
          </p>
        </div>
      </main>
    );
  }

  if (!tank.data) {
    return (
      <main className="planner-surface">
        <div className="planner-container">
          <h2>Tank not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This tank is not on your list any more.{" "}
            <Link to="/tracker" className="font-semibold text-water underline">
              Back to the tracker
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  const rows = tests.data ?? [];
  const latest = rows[0] ?? null;
  const verdict = cycleVerdict(tank.data, latest);
  const nitrate_note = nitrateNote(latest);
  const stale = latest !== null && !isTestCurrent(latest.tested_on);

  function num(v: string): number | null {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function submitTest(e: React.FormEvent) {
    e.preventDefault();
    log.mutate(
      {
        tested_on: testedOn,
        ammonia_mg_l: num(ammonia),
        nitrite_mg_l: num(nitrite),
        nitrate_mg_l: num(nitrate),
        ph: num(ph),
        temp_c: num(temp),
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Test logged");
          setAmmonia("");
          setNitrite("");
          setNitrate("");
          setPh("");
          setTemp("");
          setNote("");
          setTestedOn(TODAY());
        },
        onError: (error) =>
          toast.error("Couldn't log this test", {
            description: error instanceof Error ? error.message : "Try again in a moment.",
          }),
      },
    );
  }

  const colour =
    verdict.severity === "critical"
      ? "var(--verdict-critical)"
      : verdict.severity === "caution"
        ? "var(--verdict-caution)"
        : "var(--verdict-good)";

  return (
    <main className="planner-surface">
      <div className="planner-container">
        <Link to="/tracker" className="planner-back">
          ← Back to the tracker
        </Link>
        <header className="planner-heading">
          <div>
            <p className="planner-eyebrow">TANK PARAMETERS</p>
            <h1>{tank.data.name}</h1>
            <p className="data-mono mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {tank.data.litres ? `${tank.data.litres} L · ` : ""}
              {rows.length} {rows.length === 1 ? "test" : "tests"} logged
            </p>
          </div>
        </header>

        {/* Cycle verdict */}
        <section className="fishtankr-panel p-5" style={{ borderLeft: `3px solid ${colour}` }}>
          <p className="science-label text-muted-foreground">Cycle</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-foreground">
            {verdict.severity === "good" ? (
              <CheckCircle2 className="h-5 w-5 text-verdict-good" aria-hidden />
            ) : (
              <AlertTriangle className="h-5 w-5" style={{ color: colour }} aria-hidden />
            )}
            {verdict.label}
          </p>
          <p className="mt-2 text-sm text-foreground/85">{verdict.detail}</p>
          <p className="mt-1 text-sm text-muted-foreground">{verdict.action}</p>
          {stale && (
            <p className="mt-3 text-sm text-muted-foreground">
              Your newest test is {testAgeDays(latest!.tested_on)} days old. Test again to keep this
              reading honest.
            </p>
          )}
          {nitrate_note && <p className="mt-3 text-sm text-muted-foreground">{nitrate_note}</p>}
        </section>

        {/* Tank settings */}
        <section className="fishtankr-panel mt-4 space-y-3 p-5">
          <p className="science-label text-muted-foreground">Filter and cycling method</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice<CycleStatus>
              label="Cycle"
              value={tank.data.cycle_status}
              labels={CYCLE_STATUS_LABEL}
              options={["not_started", "cycling", "verified", "unknown"]}
              onChange={(v) => update.mutate({ cycle_status: v })}
            />
            <Choice<CycleMethod>
              label="Cycling method"
              value={tank.data.cycle_method}
              labels={CYCLE_METHOD_LABEL}
              options={["fishless", "seeded", "plant_only", "fish_in", "unknown"]}
              onChange={(v) => update.mutate({ cycle_method: v })}
            />
            <Choice<MediaMaturity>
              label="Filter media age"
              value={tank.data.filter_maturity}
              labels={MATURITY_LABEL}
              options={["new", "maturing", "established", "unknown"]}
              onChange={(v) => update.mutate({ filter_maturity: v })}
            />
            <Choice<MediaLevel>
              label="Biological media"
              value={tank.data.biological_media_level}
              labels={MEDIA_LEVEL_LABEL}
              options={["minimal", "standard", "generous"]}
              onChange={(v) => update.mutate({ biological_media_level: v })}
            />
          </div>
          <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2 text-sm">
            <span>
              <span className="block font-medium text-foreground">Seeded media used</span>
              <span className="block text-xs text-muted-foreground">
                Media moved across from an established healthy filter
              </span>
            </span>
            <input
              type="checkbox"
              checked={tank.data.seeded_media}
              onChange={(e) => update.mutate({ seeded_media: e.target.checked })}
              className="h-5 w-5"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Tank age in weeks</span>
            <input
              type="number"
              min={0}
              defaultValue={tank.data.tank_age_weeks ?? ""}
              onBlur={(e) =>
                update.mutate({
                  tank_age_weeks: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm"
            />
          </label>
        </section>

        {/* Log a test */}
        <form onSubmit={submitTest} className="fishtankr-panel mt-4 space-y-3 p-5">
          <p className="science-label text-muted-foreground">Log a test</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Tested on" type="date" value={testedOn} onChange={setTestedOn} required />
            <Field label="Ammonia mg/L" value={ammonia} onChange={setAmmonia} />
            <Field label="Nitrite mg/L" value={nitrite} onChange={setNitrite} />
            <Field label="Nitrate mg/L" value={nitrate} onChange={setNitrate} />
            <Field label="pH" value={ph} onChange={setPh} />
            <Field label="Temperature °C" value={temp} onChange={setTemp} />
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Note, optional</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Changed 30% of the water"
              className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={log.isPending}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {log.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save test
          </button>
        </form>

        {/* Trend and history */}
        {rows.length > 0 && (
          <section className="fishtankr-panel mt-4 p-5">
            <p className="science-label text-muted-foreground">History</p>
            <Trend rows={rows} />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="science-label text-muted-foreground">
                    <th className="py-2">Date</th>
                    <th className="py-2">NH3</th>
                    <th className="py-2">NO2</th>
                    <th className="py-2">NO3</th>
                    <th className="py-2">pH</th>
                    <th className="py-2">°C</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-foreground/10">
                      <td className="data-mono py-2">{row.tested_on}</td>
                      <td className="data-mono py-2">{row.ammonia_mg_l ?? "–"}</td>
                      <td className="data-mono py-2">{row.nitrite_mg_l ?? "–"}</td>
                      <td className="data-mono py-2">{row.nitrate_mg_l ?? "–"}</td>
                      <td className="data-mono py-2">{row.ph ?? "–"}</td>
                      <td className="data-mono py-2">{row.temp_c ?? "–"}</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          aria-label={`Remove the test from ${row.tested_on}`}
                          onClick={() => removeTest.mutate(row.id)}
                          className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.some((r) => r.note) && (
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                {rows
                  .filter((r) => r.note)
                  .map((r) => (
                    <li key={`note-${r.id}`}>
                      <span className="data-mono">{r.tested_on}</span> {r.note}
                    </li>
                  ))}
              </ul>
            )}
          </section>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          Working out which fish to buy?{" "}
          <Link to="/calculator" className="font-semibold text-water underline">
            Open the stocking calculator
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "number",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        step="any"
        min={type === "number" ? 0 : undefined}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function Choice<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm"
      >
        {options.map((v) => (
          <option key={v} value={v}>
            {labels[v]}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Oldest to newest, so a finishing cycle reads left to right. */
function Trend({ rows }: { rows: WaterTest[] }) {
  const series = [...rows].reverse();
  if (series.length < 2) {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        Log a second test to see how the readings are moving.
      </p>
    );
  }
  const lines: Array<{ key: keyof WaterTest; label: string; colour: string }> = [
    { key: "ammonia_mg_l", label: "Ammonia", colour: "var(--verdict-critical)" },
    { key: "nitrite_mg_l", label: "Nitrite", colour: "var(--verdict-caution)" },
    { key: "nitrate_mg_l", label: "Nitrate", colour: "var(--water)" },
  ];
  const values = series.flatMap((r) =>
    lines.map((l) => (typeof r[l.key] === "number" ? (r[l.key] as number) : 0)),
  );
  const max = Math.max(1, ...values);
  const w = 100;
  const h = 40;
  const x = (i: number) => (i / (series.length - 1)) * w;
  const y = (v: number) => h - (v / max) * h;

  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" role="img" aria-label="Test trend">
        {lines.map((l) => (
          <polyline
            key={String(l.key)}
            fill="none"
            stroke={l.colour}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            points={series
              .map((r, i) => `${x(i)},${y(typeof r[l.key] === "number" ? (r[l.key] as number) : 0)}`)
              .join(" ")}
          />
        ))}
      </svg>
      <p className="data-mono mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {lines.map((l) => l.label).join(" · ")} · peak {max} mg/L
      </p>
    </div>
  );
}
