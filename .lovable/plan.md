
## Goal

Before the user saves a tank, surface the concrete risks the scorecard already knows about and ask them to acknowledge or fix each one. Experienced users can turn the check off.

## What "checklist" means here

Every item is derived from the existing `Scorecard` result — no new scoring logic. Items are bucketed by severity:

- **Must fix** (blocks silent save)
  - Any species in `legality.illegalSpecies` → "Prohibited species in the tank"
  - Any string in `compatibility.criticalConflicts` → predation warning per pair
  - `bioload.loadPercent > 110` → "Overstocked — filter and water changes won't keep up"

- **Worth another look** (shown but doesn't block)
  - `bioload.loadPercent` between 90–110 → "Close to capacity"
  - `state.maintenance_frequency === "monthly"` and load > 60% → "Monthly maintenance is thin for this stocking"
  - Filter turnover-per-hour vs volume < 4× → "Filter is undersized for the tank"
  - `space.score < 60` → surfaces `space.reasons[0]` (min-tank / swim-length shortfall)
  - `biome.score < 50` → "Mixed biotope — species from different regions"
  - Schooling species below minimum group size (derived from `state.species` + `min_group_size`)

- **Info** (rendered as neutral notes, not gating)
  - `legality.nativeNotes` — state-permit reminders

Each item has: title, one-line why, one-line fix hint, and an optional "Jump to setup" that scrolls to the relevant section anchor.

## Guard preference

- New localStorage key `fishtankr:prestock-guard` (`"on" | "off"`, defaults to `"on"`).
- Toggle rendered inside the checklist panel: "Skip this check — I know what I'm doing" (shadcn `Switch`, with helper text). Persists across sessions.

## Save flow

Wrap `handleSave` in `src/routes/index.tsx`:

- Guard **on**:
  - No must-fix items → save immediately (current behaviour).
  - Must-fix items present → open a shadcn `AlertDialog` listing them, with two actions: **Adjust tank** (closes dialog, does nothing else) and **Save anyway** (proceeds with save and toasts a warning). "Worth another look" items appear in the dialog as a secondary list, not as blockers.
- Guard **off**: save immediately, no dialog. The inline panel still renders so the risks remain visible.

Share (`handleSave(true)`) uses the same gate.

## Where it renders

New component `PreStockChecklist` mounted in the right-hand scorecard column, directly above the existing `ScorecardPanel`. It's a card with:

- Header: "Pre-stock check" + item count badges (e.g. "2 must fix · 1 look").
- Collapsible body (shadcn `Collapsible`, expanded by default when there are must-fix items, otherwise collapsed).
- Guard toggle at the bottom of the body.
- When the tank has no species, panel shows a single neutral row: "Add fish to run the check."

## Files touched

- New `src/components/PreStockChecklist.tsx` — item derivation, inline panel, and the confirmation `AlertDialog`. Exports `PreStockChecklist` and a helper `useSaveGate({ scorecard, state })` that returns `{ mustFix, worthLook, guardOn, setGuardOn, confirmSave }` so the route can wire it into `handleSave`.
- `src/routes/index.tsx` — render `<PreStockChecklist />` above `<ScorecardPanel />`, replace direct `handleSave` calls with the gated version from the hook.

## Out of scope

- No scoring engine changes.
- No new database columns or migrations.
- No new checklist items beyond what the current scorecard can already tell us.
- Guard toggle is device-local (localStorage) — not synced to the account.
