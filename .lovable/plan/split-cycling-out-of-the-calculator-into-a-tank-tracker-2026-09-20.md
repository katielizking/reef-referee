# Split cycling out of the calculator into a tank tracker

The stocking calculator goes back to answering one question: will these fish live well in this tank? Everything about cycling, biofilter maturity and water test results moves to a new tracker where you can keep several tanks and log test results over time.

## The calculator after the split

- The "Filter, cycle and maintenance" step becomes "Filter and maintenance": you still pick your filter or filters and how often you do water changes.
- Gone from this page: filter media maturity, nitrogen cycle status, cycling method, seeded media, tank age, and the ammonia, nitrite, nitrate and test date fields.
- The score no longer holds itself back for an uncycled or untested tank. It scores the mix of fish, swimming space and water targets only.
- In place of the cycle section of the results, a short line: your score assumes the tank is already cycled, with a link to the tracker.
- Existing saved tanks keep working. Nothing is deleted from the database; the calculator simply stops asking for those values.

## The new tracker

A page at `/tracker` with its own list of tanks, separate from calculator plans, so you can track a tank you never planned here.

Tank list

- Name, water volume, how old the tank is, current cycle stage, and the date of the last test.
- Add, rename and remove tanks. Saved to your account, so they follow you rather than living in one browser.

Tank detail

- Cycle state at the top: not started, cycling, cycled, or a stop signal when ammonia or nitrite is showing, with plain next steps.
- Filter media maturity, cycling method and seeded media live here.
- "Log a test" form: date, ammonia, nitrite, nitrate, pH, temperature, plus an optional note.
- Full history, newest first, with a simple trend line for ammonia, nitrite and nitrate so you can watch a cycle finish.
- A warning when the newest test is more than seven days old.

## Technical notes

Database (one migration, additive only)

- `tracked_tanks`: id, user_id, name, litres, tank_age_weeks, cycle_status, cycle_method, filter_maturity, biological_media_level, seeded_media, timestamps. Owner-only RLS on `auth.uid()`, plus GRANTs for authenticated and service_role.
- `water_tests`: id, tank_id (cascade), user_id, tested_on, ammonia_mg_l, nitrite_mg_l, nitrate_mg_l, ph, temp_c, note, created_at. Same RLS shape and GRANTs. Index on (tank_id, tested_on desc).
- No columns dropped from `tanks`; the calculator writes the existing defaults.

Scoring engine

- `scoreReadiness` stays and keeps its issue codes, but the three readiness caps (25 / 35 / 60) come out of `scoreTank`, and `readiness` issues stop feeding the calculator's must-fix list, the priority action, the printed plan and the suggestion filter. The tracker reuses `scoreReadiness` and `isWaterTestCurrent` for its cycle verdict, fed from the tracked tank plus its newest test.
- Cases added to `src/lib/scoring/scoring.test.ts` in the same change: a plan with ammonia present and no other faults is no longer capped, and the existing capped-score expectations are updated with a note in the commit message explaining why the baseline moved.

Files

- New: `src/routes/tracker.index.tsx`, `src/routes/tracker.$id.tsx`, `src/lib/tracker.ts` (queries and mutations), `src/lib/cycle-status.ts` (verdict from tank plus newest test), `src/components/tracker/*`, `src/lib/cycle-status.test.ts`.
- Edited: `TankSetupPanel.tsx` (fields removed), `Scorecard.tsx`, `PreStockChecklist.tsx`, `TankReport.tsx`, `src/lib/commercial.ts`, `src/lib/suggestions.ts` (drop readiness), `src/lib/scoring/index.ts` (caps), `__root.tsx` nav link, `sitemap[.]xml.ts`.
- `/tracker` routes get their own head metadata; tank detail pages are noindex since they are personal.

Checks: `tsgo --noEmit`, vitest, lint, then a browser pass over `/calculator`, `/tracker` and a tracked tank.
