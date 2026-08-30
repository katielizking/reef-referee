import { BIOTOPE_LABEL } from "@/lib/types";
import { WEIGHTS, type Issue, type Scorecard } from "@/lib/scoring";
import { Link } from "@tanstack/react-router";

type ResultKind = "good" | "watch" | "bad";

function resultFor(overall: number, capReason: string | null): ResultKind {
  if (overall < 45) return "bad";
  if (overall < 75 || capReason) return "watch";
  return "good";
}

const RESULT: Record<ResultKind, { word: string; sub: string; var: string }> = {
  good: {
    word: "Looks suitable so far",
    sub: "Nothing needs your attention right now. Keep watching the fish and testing the water.",
    var: "var(--verdict-good)",
  },
  watch: {
    word: "Risky as planned",
    sub: "There are welfare concerns to fix before you add fish.",
    var: "var(--verdict-caution)",
  },
  bad: {
    word: "Do not stock",
    sub: "This plan has a serious welfare risk. Fix it before adding fish.",
    var: "var(--verdict-critical)",
  },
};

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
  const result = s.overall === null ? null : resultFor(s.overall, s.capReason);
  const meta = result ? RESULT[result] : null;

  return (
    <div className="space-y-4">
      {/* Verdict */}
      <div className="fishtankr-panel p-5">
        <p className="science-label text-water">Live referee</p>
        {s.overall === null ? (
          <>
            <p className="data-mono mt-3 text-5xl leading-none text-muted-foreground">—</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Add fish to see how well this tank meets their needs.
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 text-xl font-semibold tracking-tight" style={{ color: meta!.var }}>
              {meta!.word}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{meta!.sub}</p>
            <div
              className="mt-4 flex items-end gap-2"
              aria-label={`Welfare score ${s.overall} out of 100`}
            >
              <span className="data-mono text-3xl leading-none" style={{ color: meta!.var }}>
                {s.overall}
              </span>
              <span className="data-mono text-xs text-muted-foreground">/100</span>
            </div>
            {s.capReason && (
              <p
                className="mt-3 border-l-2 pl-3 text-sm text-foreground"
                style={{ borderColor: "var(--verdict-caution)" }}
              >
                {s.capReason}
              </p>
            )}
          </>
        )}
      </div>

      {/* Do this first */}
      {s.priorityAction && (
        <div
          className="fishtankr-panel border-l-2 p-5"
          style={{
            borderLeftColor:
              s.priorityAction.severity === "critical"
                ? "var(--verdict-critical)"
                : s.priorityAction.severity === "high"
                  ? "var(--verdict-caution)"
                  : "var(--water)",
          }}
        >
          <p className="science-label text-muted-foreground">
            Do this first · {s.priorityAction.category}
          </p>
          <p className="mt-3 text-base font-semibold tracking-tight text-foreground">
            {s.priorityAction.title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{s.priorityAction.action}</p>
        </div>
      )}

      {/* Instrument panel */}
      <div className="fishtankr-panel px-5 py-2">
        <ScoreRow
          title="Cycle and biofilter"
          statusLabel={s.readiness.status}
          tag="Safety gate"
          issues={s.readiness.issues}
          reasons={s.readiness.reasons}
        />
        <ScoreRow
          title="Species compatibility"
          score={s.compatibility.score}
          weightPct={Math.round(WEIGHTS.compatibility * 100)}
          issues={s.compatibility.issues}
          reasons={s.compatibility.reasons}
        />
        <ScoreRow
          title="Space to swim"
          score={s.space.score}
          weightPct={Math.round(WEIGHTS.space * 100)}
          issues={s.space.issues}
          reasons={s.space.reasons}
        />
        <ScoreRow
          title="Water suitability"
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
        <p className="science-label text-muted-foreground">Style goal · not part of the score</p>
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
          Your score is based on compatibility, swimming space and water suitability. An unverified
          cycle can limit the result. Waste load is still in beta and does not affect the score.{" "}
          <Link to="/methodology" className="font-semibold text-water underline">
            See how the score works.
          </Link>{" "}
          <Link to="/welfare-disclaimer" className="font-semibold text-water underline">
            Know its limits.
          </Link>
        </p>
      )}
    </div>
  );
}
