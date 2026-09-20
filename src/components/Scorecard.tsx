import { BIOTOPE_LABEL, type TankState } from "@/lib/types";
import { WEIGHTS, type Issue, type Scorecard } from "@/lib/scoring";
import { Link } from "@tanstack/react-router";
import { WelfareVerdictCard } from "@/components/WelfareVerdictCard";
import { waterChangeGuidance } from "@/lib/water-change";
import { formatVolume, useUnitSystem } from "@/lib/units";

const SEVERITY_ORDER: Issue["severity"][] = ["critical", "high", "medium", "low"];

const SEVERITY_LABEL: Record<Issue["severity"], string> = {
  critical: "Critical",
  high: "Important",
  medium: "Worth doing",
  low: "Minor",
};

function severityColour(severity: Issue["severity"]) {
  if (severity === "critical") return "var(--verdict-critical)";
  if (severity === "high") return "var(--verdict-caution)";
  return "var(--rule)";
}

function barColour(score: number) {
  if (score >= 75) return "var(--verdict-good)";
  if (score >= 45) return "var(--verdict-caution)";
  return "var(--verdict-critical)";
}

function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null;
  const sorted = [...issues].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
      b.weight - a.weight,
  );
  return (
    <ul className="mt-3 space-y-2">
      {sorted.map((issue, i) => (
        <li
          key={`${issue.code}-${i}`}
          className="pl-3"
          style={{ borderLeft: `2px solid ${severityColour(issue.severity)}` }}
        >
          <p className="data-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {SEVERITY_LABEL[issue.severity]}
          </p>
          <p
            className={`text-sm ${issue.severity === "critical" ? "font-semibold text-foreground" : "text-foreground/85"}`}
          >
            {issue.reason}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{issue.fix}</p>
        </li>
      ))}
    </ul>
  );
}

interface RowProps {
  title: string;
  score?: number;
  statusLabel?: string;
  weightPct?: number;
  note?: string;
  tag?: string;
  issues?: Issue[];
  reasons: string[];
}

function ScoreRow({ title, score, statusLabel, weightPct, note, tag, issues, reasons }: RowProps) {
  const list = issues ?? [];
  return (
    <div className="border-t border-rule py-4 first:border-t-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          {title}
          {typeof weightPct === "number" && (
            <span className="data-mono ml-2 text-[10px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
              {weightPct}% of score
            </span>
          )}
          {tag && (
            <span className="data-mono ml-2 text-[10px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
              {tag}
            </span>
          )}
        </p>
        {typeof score === "number" ? (
          <span className="data-mono shrink-0 text-sm text-foreground">
            {score}
            <span className="text-muted-foreground">/100</span>
          </span>
        ) : statusLabel ? (
          <span className="data-mono shrink-0 text-sm capitalize text-foreground">
            {statusLabel.replace("-", " ")}
          </span>
        ) : null}
      </div>

      {typeof score === "number" && (
        <div className="mt-2 h-[3px] w-full" style={{ background: "var(--rule)" }} aria-hidden>
          <div className="h-full" style={{ width: `${score}%`, background: barColour(score) }} />
        </div>
      )}

      {note && <p className="mt-2 text-sm text-muted-foreground">{note}</p>}

      {list.length > 0 ? (
        <IssueList issues={list} />
      ) : (
        reasons.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{reasons[0]}</p>
      )}
    </div>
  );
}

export function ScorecardPanel({ scorecard }: { scorecard: Scorecard }) {
  const s = scorecard;

  return (
    <div className="space-y-4">
      <WelfareVerdictCard scorecard={s} />

      {/* Instrument panel */}
      <div className="fishtankr-panel px-5 py-2">
        <ScoreRow
          title="Cycle and filter"
          statusLabel={s.readiness.status}
          tag="Safety gate"
          issues={s.readiness.issues}
          reasons={s.readiness.reasons}
        />
        <ScoreRow
          title="Tank mates"
          score={s.compatibility.score}
          weightPct={Math.round(WEIGHTS.compatibility * 100)}
          issues={s.compatibility.issues}
          reasons={s.compatibility.reasons}
        />
        <ScoreRow
          title="Swimming room"
          score={s.space.score}
          weightPct={Math.round(WEIGHTS.space * 100)}
          issues={s.space.issues}
          reasons={s.space.reasons}
        />
        <ScoreRow
          title="Water match"
          score={s.water.score}
          weightPct={Math.round(WEIGHTS.water * 100)}
          issues={s.water.issues}
          reasons={s.water.reasons}
        />
        <ScoreRow
          title="Waste load"
          statusLabel={s.bioload.loadBand}
          tag="Beta · not scored"
          note={s.bioload.reasons[0]}
          issues={s.bioload.issues}
          reasons={[]}
        />
      </div>

      {/* Style goal, below the rule */}
      <div className="fishtankr-panel p-5">
        <p className="science-label text-muted-foreground">Style only · not part of the score</p>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">
            Biotope match
            {s.biome.dominantRegion && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {BIOTOPE_LABEL[s.biome.dominantRegion]}
              </span>
            )}
          </p>
          <span className="data-mono shrink-0 text-sm text-foreground">
            {s.biome.score}
            <span className="text-muted-foreground">/100</span>
          </span>
        </div>
        <div className="mt-2 h-[3px] w-full" style={{ background: "var(--rule)" }} aria-hidden>
          <div
            className="h-full"
            style={{ width: `${s.biome.score}%`, background: "var(--water)" }}
          />
        </div>
        {s.biome.badge === "true-biotope" && (
          <span className="ink-stamp mt-3 inline-block">True biotope</span>
        )}
        {s.biome.reasons.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">{s.biome.reasons[0]}</p>
        )}
      </div>

      {s.overall !== null && (
        <p className="text-sm text-muted-foreground">
          The score checks tank mates, swimming room and water. An unverified cycle can cap it.
          Waste load is beta and does not affect it.{" "}
          <Link to="/methodology" className="font-semibold text-water underline">
            How scoring works.
          </Link>{" "}
          <Link to="/welfare-disclaimer" className="font-semibold text-water underline">
            Score limits.
          </Link>
        </p>
      )}
    </div>
  );
}
