import type { Issue, Scorecard } from "@/lib/scoring";
import { combinedFiltration } from "@/lib/scoring";
import type { TankState } from "@/lib/types";
import { SUBSTRATE_LABEL, TANK_SHAPE_LABEL } from "@/lib/types";
import { welfareVerdictFor } from "@/lib/welfare-verdict";
import { waterChangeGuidance } from "@/lib/water-change";
import { checkInvertebrates } from "@/lib/invert-check";
import { checkSetup } from "@/lib/setup-check";
import { waterLitres } from "@/lib/tank-shape";

const SEVERITY_ORDER: Issue["severity"][] = ["critical", "high", "medium", "low"];

function allIssues(s: Scorecard): Issue[] {
  return [
    ...s.compatibility.issues,
    ...(s.space.issues ?? []),
    ...(s.water.issues ?? []),
    ...(s.bioload.issues ?? []),
  ].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) || b.weight - a.weight,
  );
}

/**
 * A one page summary to take to the shop. Hidden on screen, laid out for paper
 * and for "print to PDF". Everything here is already on the scorecard.
 */
export function TankReport({ scorecard, state }: { scorecard: Scorecard; state: TankState }) {
  const litres = Math.round(waterLitres(state));
  const setupIssues = checkSetup(state);
  const verdict = welfareVerdictFor(scorecard);
  const water = waterChangeGuidance(state, scorecard);
  const filtration = combinedFiltration(state);
  const issues = allIssues(scorecard);
  const fishCount = state.species.reduce((n, row) => n + row.quantity, 0);

  return (
    <section className="tank-report" aria-hidden>
      <header>
        <h1>{state.name || "My tank"}</h1>
        <p>
          FishTankr stocking plan · {new Date().toLocaleDateString("en-AU")} · a helpful guide, not a
          guarantee
        </p>
      </header>

      <h2>
        {verdict.label} {scorecard.overall !== null && <span>· {scorecard.overall}/100</span>}
      </h2>
      <p>{verdict.summary}</p>

      <h3>The tank</h3>
      <ul>
        <li>
          {TANK_SHAPE_LABEL[state.tank_shape ?? "rectangle"]} · {state.length_cm} ×{" "}
          {state.width_cm} × {state.height_cm} cm · {litres} L of water
        </li>
        <li>
          Filters: {filtration.count || "none chosen"}
          {filtration.count > 0 &&
            ` · ${filtration.biological_media_level} media · ${filtration.filter_maturity} · ${Math.round(filtration.turnover_lph)} L/h total flow`}
        </li>
        <li>
          Planned water: pH {state.target_ph} · {state.target_temp_c} °C
        </li>
        <li>
          Planting: {state.plant_density} · maintenance {state.maintenance_frequency}
        </li>
        <li>
          Substrate: {SUBSTRATE_LABEL[state.substrate ?? "gravel"]} · heater{" "}
          {(state.has_heater ?? true) ? "yes" : "no"} · light{" "}
          {(state.has_light ?? true) ? "yes" : "no"} · CO2 {state.has_co2 ? "yes" : "no"}
        </li>
      </ul>

      {setupIssues.length > 0 && (
        <>
          <h3>Substrate and equipment</h3>
          <ul>
            {setupIssues.map((issue) => (
              <li key={issue.code}>
                {issue.severity === "critical" ? "Fix first: " : ""}
                {issue.reason} {issue.fix}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>
        Shopping list · {state.species.length} species, {fishCount} fish
      </h3>
      <table>
        <thead>
          <tr>
            <th>Fish</th>
            <th>Qty</th>
            <th>Adult size</th>
            <th>Min tank</th>
          </tr>
        </thead>
        <tbody>
          {state.species.map((row) => (
            <tr key={row.species.id}>
              <td>
                {row.species.common_name} <em>{row.species.scientific_name}</em>
              </td>
              <td>{row.quantity}</td>
              <td>{row.species.adult_size_cm} cm</td>
              <td>{row.species.min_tank_litres} L</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(state.invertebrates ?? []).length > 0 && (
        <>
          <h3>Invertebrates</h3>
          <ul>
            {(state.invertebrates ?? []).map((row) => (
              <li key={row.invertebrate.id}>
                {row.quantity} × {row.invertebrate.common_name}{" "}
                <em>{row.invertebrate.scientific_name}</em> · {row.invertebrate.adult_size_cm} cm ·
                min {row.invertebrate.min_tank_litres} L
              </li>
            ))}
          </ul>
          <ul>
            {checkInvertebrates(state).map((issue, i) => (
              <li key={`${issue.code}-${i}`}>
                <strong>{issue.severity === "critical" ? "Critical: " : ""}</strong>
                {issue.reason} {issue.fix}
              </li>
            ))}
          </ul>
        </>
      )}

      {scorecard.priorityAction && (
        <>
          <h3>Fix this first</h3>
          <p>
            <strong>{scorecard.priorityAction.title}</strong> {scorecard.priorityAction.action}
          </p>
        </>
      )}

      {issues.length > 0 && (
        <>
          <h3>What needs attention</h3>
          <ul>
            {issues.map((issue, i) => (
              <li key={`${issue.code}-${i}`}>
                <strong>{issue.severity === "critical" ? "Critical: " : ""}</strong>
                {issue.reason} {issue.fix}
              </li>
            ))}
          </ul>
        </>
      )}

      {water && (
        <>
          <h3>Water changes</h3>
          <p>
            About {water.weeklyPercent}% a week, roughly {water.litres} L. {water.sentence}
            {water.frequencyNote ? ` ${water.frequencyNote}` : ""}
          </p>
        </>
      )}

      <footer>
        <p>
          Biotope match is a style goal and is not part of the score. Waste load is a beta screen.
          Check local rules before you buy. fishtankr.com
        </p>
      </footer>
    </section>
  );
}
