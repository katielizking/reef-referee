import { BIOTOPE_LABEL } from "@/lib/types";
import type { Scorecard } from "@/lib/scoring";
import { AlertTriangle, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";

function toneFor(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  if (score >= 50) return "text-orange-600";
  return "text-red-600";
}

function ringColor(score: number) {
  if (score >= 85) return "stroke-emerald-500";
  if (score >= 70) return "stroke-amber-500";
  if (score >= 50) return "stroke-orange-500";
  return "stroke-red-500";
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} className="stroke-muted" strokeWidth="8" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        className={ringColor(score)}
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-foreground font-semibold"
        fontSize={size * 0.28}
      >
        {score}
      </text>
    </svg>
  );
}

interface SubCardProps {
  title: string;
  score: number;
  weightPct: number;
  reasons: string[];
  fixes: string[];
  extra?: React.ReactNode;
}

function SubCard({ title, score, weightPct, reasons, fixes, extra }: SubCardProps) {
  const [open, setOpen] = useState(false);
  const hasFixes = fixes.length > 0;
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {title} · {weightPct}%
          </p>
          <div className={`text-2xl font-semibold ${toneFor(score)}`}>{score}</div>
        </div>
        {extra}
      </div>
      <ul className="mt-2 space-y-1 text-sm text-foreground/80">
        {reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
      {hasFixes && (
        <button
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide" : "Show"} {fixes.length} suggested fix{fixes.length > 1 ? "es" : ""}
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
        </button>
      )}
      {open && (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {fixes.map((f, i) => (
            <li key={i}>· {f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ScorecardPanel({ scorecard }: { scorecard: Scorecard }) {
  const s = scorecard;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-4">
          {s.overall === null ? (
            <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 text-3xl font-semibold text-muted-foreground">
              —
            </div>
          ) : (
            <ScoreRing score={s.overall} />
          )}
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall score</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {s.overall === null
                ? "Add fish to get a score"
                : "Weighted from compatibility, bioload, space, biome and legality."}
            </p>
            {s.capReason && (
              <p className="mt-2 flex items-start gap-1 text-xs font-medium text-amber-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{s.capReason}</span>
              </p>
            )}
            {s.biome.badge === "true-biotope" && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" /> True biotope
              </div>
            )}
          </div>
        </div>
      </div>


      {s.legality.illegalSpecies.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Not legal in Australia</p>
              <p className="mt-1 text-sm">
                {s.legality.illegalSpecies.join(", ")} cannot be legally imported or kept.
              </p>
            </div>
          </div>
        </div>
      )}

      <SubCard
        title="Species compatibility"
        score={s.compatibility.score}
        weightPct={25}
        reasons={s.compatibility.reasons}
        fixes={s.compatibility.fixes}
      />
      <SubCard
        title="Bioload"
        score={s.bioload.score}
        weightPct={20}
        reasons={s.bioload.reasons}
        fixes={s.bioload.fixes}
        extra={
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {s.bioload.loadPercent}% load
          </span>
        }
      />
      <SubCard
        title="Space to swim"
        score={s.space.score}
        weightPct={20}
        reasons={s.space.reasons}
        fixes={s.space.fixes}
      />
      <SubCard
        title="Biome replication"
        score={s.biome.score}
        weightPct={25}
        reasons={s.biome.reasons}
        fixes={s.biome.fixes}
        extra={
          s.biome.dominantRegion ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {BIOTOPE_LABEL[s.biome.dominantRegion]}
            </span>
          ) : null
        }
      />
      <SubCard
        title="Australian legality"
        score={s.legality.score}
        weightPct={10}
        reasons={s.legality.reasons}
        fixes={s.legality.fixes}
      />
    </div>
  );
}
