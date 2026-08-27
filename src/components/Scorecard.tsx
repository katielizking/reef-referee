import { BIOTOPE_LABEL } from "@/lib/types";
import type { Scorecard } from "@/lib/scoring";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  Sparkles,
} from "lucide-react";
import { useState, type ComponentType, type SVGProps } from "react";
import { Link } from "@tanstack/react-router";

type ResultKind = "good" | "watch" | "bad";

function resultFor(overall: number, capReason: string | null): ResultKind {
  if (overall < 45) return "bad";
  if (overall < 75 || capReason) return "watch";
  return "good";
}

const RESULT: Record<
  ResultKind,
  {
    label: string;
    sub: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    ringVar: string;
    chipBg: string;
    chipText: string;
  }
> = {
  good: {
    label: "Looking good",
    sub: "No current calculator flags require action.",
    icon: CheckCircle2,
    ringVar: "var(--lime)",
    chipBg: "bg-lime/30",
    chipText: "text-foreground",
  },
  watch: {
    label: "Worth another look",
    sub: "A few things to review before you stock.",
    icon: AlertCircle,
    ringVar: "var(--warn)",
    chipBg: "bg-warn/20",
    chipText: "text-foreground",
  },
  bad: {
    label: "Not recommended",
    sub: "This setup raises a welfare or safety concern.",
    icon: AlertTriangle,
    ringVar: "var(--coral)",
    chipBg: "bg-coral/20",
    chipText: "text-foreground",
  },
};

function ScoreRing({
  score,
  color,
  size = 128,
  label = "Overall",
}: {
  score: number;
  color: string;
  size?: number;
  label?: string;
}) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <svg
      width={size}
      height={size}
      className="shrink-0"
      role="img"
      aria-label={`${label} score ${score} out of 100`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--muted)"
        strokeWidth="8"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="46%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-foreground font-display font-semibold"
        fontSize={size * 0.3}
      >
        {score}
      </text>
      <text
        x="50%"
        y="68%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={size * 0.11}
      >
        / 100
      </text>
    </svg>
  );
}

interface SubCardProps {
  title: string;
  score?: number;
  statusLabel?: string;
  weightPct?: number;
  reasons: string[];
  fixes: string[];
  calculation: string;
  extra?: React.ReactNode;
}

function SubCard({
  title,
  score,
  statusLabel,
  weightPct,
  reasons,
  fixes,
  calculation,
  extra,
}: SubCardProps) {
  const [open, setOpen] = useState(false);
  const hasFixes = fixes.length > 0;
  return (
    <div className="depth-card rounded-[1.5rem] border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            {typeof weightPct === "number" && (
              <span
                className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                title={`Contributes ${weightPct}% to overall`}
              >
                {weightPct}% weight
              </span>
            )}
          </div>
          {typeof score === "number" ? (
            <>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-2xl font-bold tracking-tight text-foreground">
                  {score}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    score >= 75
                      ? "bg-lime"
                      : score >= 45
                        ? "bg-warn"
                        : "bg-coral"
                  }`}
                  style={{ width: `${score}%` }}
                  aria-hidden
                />
              </div>
            </>
          ) : statusLabel ? (
            <p className="mt-2 font-display text-xl font-bold capitalize tracking-tight text-foreground">
              {statusLabel.replace("-", " ")}
            </p>
          ) : null}
        </div>
        {extra}
      </div>
      {reasons.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-foreground/80">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      {hasFixes && (
        <button
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide" : "Show"} {fixes.length} suggestion
          {fixes.length > 1 ? "s" : ""}
          <ChevronDown
            className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
          />
        </button>
      )}
      {open && (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {fixes.map((f, i) => (
            <li key={i}>· {f}</li>
          ))}
        </ul>
      )}
      <details className="mt-3 border-t border-border/70 pt-2">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          How this is calculated
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {calculation}
        </p>
      </details>
    </div>
  );
}

export function ScorecardPanel({ scorecard }: { scorecard: Scorecard }) {
  const s = scorecard;
  const result = s.overall === null ? null : resultFor(s.overall, s.capReason);
  const meta = result ? RESULT[result] : null;
  const Icon = meta?.icon;

  return (
    <div className="space-y-4">
      <div className="fishtankr-panel overflow-hidden rounded-[1.75rem] p-5">
        <div className="flex items-start gap-4">
          {s.overall === null ? (
            <div
              className="flex h-[128px] w-[128px] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border font-display text-3xl font-semibold text-muted-foreground"
              aria-label="No score yet"
            >
              —
            </div>
          ) : (
            <ScoreRing score={s.overall} color={meta!.ringVar} />
          )}
          <div className="min-w-0">
            <p className="science-label text-primary">Live referee</p>
            {s.overall === null ? (
              <>
                <p className="mt-1 font-display text-lg font-semibold text-foreground">
                  Add some fish
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add livestock to see how the tank scores.
                </p>
              </>
            ) : (
              <>
                <div
                  className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta!.chipBg} ${meta!.chipText}`}
                >
                  {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
                  <span>{meta!.label}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {meta!.sub}
                </p>
                {s.capReason && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-warn/15 px-2.5 py-1.5 text-xs font-medium text-foreground">
                    <AlertTriangle
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn"
                      aria-hidden
                    />
                    <span>{s.capReason}</span>
                  </p>
                )}
                {s.biome.badge === "true-biotope" && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-lime/30 px-3 py-1 text-xs font-semibold text-foreground">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden /> True
                    biotope
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {s.overall !== null && (
          <p className="mt-4 flex items-start gap-1.5 border-t border-border/70 pt-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              The headline score covers compatibility, swimming space and water
              suitability. Cycle readiness can cap it. The waste-load screen is
              beta and informational only.{" "}
              <Link
                to="/methodology"
                className="font-semibold text-primary hover:underline"
              >
                Read the methodology.
              </Link>
            </span>
          </p>
        )}
      </div>

      {s.priorityAction && (
        <div
          className={`depth-card rounded-[1.5rem] border p-4 ${
            s.priorityAction.severity === "critical"
              ? "border-coral/40 bg-coral/10"
              : s.priorityAction.severity === "high"
                ? "border-warn/40 bg-warn/10"
                : "border-primary/30 bg-primary/5"
          }`}
        >
          <p className="science-label text-foreground/60">
            Do this first · {s.priorityAction.category}
          </p>
          <p className="mt-3 font-display text-lg font-bold tracking-tight text-foreground">
            {s.priorityAction.title}
          </p>
          <p className="mt-1 text-sm text-foreground/80">
            {s.priorityAction.action}
          </p>
        </div>
      )}

      <SubCard
        title="Cycle & biofilter readiness"
        statusLabel={s.readiness.status}
        reasons={s.readiness.reasons}
        fixes={s.readiness.fixes}
        calculation="Checks whether a biological filter is selected and established, whether the nitrogen-cycle status is recorded, and whether tests from the last 7 days show 0 mg/L ammonia and 0 mg/L nitrite. The 7-day window is an operational freshness rule, not a guarantee of future water quality. Readiness is a safety gate, not a weighted category."
        extra={
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              s.readiness.status === "ready"
                ? "bg-lime/30 text-foreground"
                : s.readiness.status === "unsafe"
                  ? "bg-coral/20 text-foreground"
                  : "bg-warn/20 text-foreground"
            }`}
          >
            Safety gate
          </span>
        }
      />
      <SubCard
        title="Species compatibility"
        score={s.compatibility.score}
        weightPct={45}
        reasons={s.compatibility.reasons}
        fixes={s.compatibility.fixes}
        calculation="Checks same-species group needs, aggression and territorial behaviour, then checks every species pair for temperament clashes, fin-nipping, predation and overlapping water ranges."
      />
      <SubCard
        title="Waste-load screen"
        statusLabel={s.bioload.loadBand}
        reasons={s.bioload.reasons}
        fixes={s.bioload.fixes}
        calculation="Beta only. This retains the inherited litres/5 reference as a broad demand screen while a sourced model is developed. It does not treat pump turnover, plants or maintenance as extra biological capacity; it does not change the welfare score or calculate room for more fish."
        extra={
          <span className="rounded-full bg-warn/20 px-2 py-0.5 text-xs font-semibold text-foreground">
            Beta · not scored
          </span>
        }
      />
      <SubCard
        title="Space to swim"
        score={s.space.score}
        weightPct={35}
        reasons={s.space.reasons}
        fixes={s.space.fixes}
        calculation="Compares each species’ minimum tank volume and adult swimming-length requirement with this tank’s volume and length."
      />
      <SubCard
        title="Water suitability"
        score={s.water.score}
        weightPct={20}
        reasons={s.water.reasons}
        fixes={s.water.fixes}
        calculation="Checks the tank’s selected pH and temperature against every fish’s care range. It is separate from pairwise compatibility, so a single fish in unsuitable water is still flagged."
        extra={
          s.water.misfits.length > 0 ? (
            <span className="rounded-full bg-warn/20 px-2 py-0.5 text-xs font-medium text-foreground">
              {s.water.misfits.length} affected
            </span>
          ) : null
        }
      />
      <SubCard
        title="Biome replication"
        score={s.biome.score}
        reasons={s.biome.reasons}
        fixes={s.biome.fixes}
        calculation="An optional habitat-authenticity measure combining species-region cohesion, water, hardscape and plants. It is shown for inspiration and never changes the welfare score."
        extra={
          s.biome.dominantRegion ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {BIOTOPE_LABEL[s.biome.dominantRegion]}
            </span>
          ) : null
        }
      />
    </div>
  );
}
