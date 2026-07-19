## 1. Score caps + null empty state

**`src/lib/scoring/index.ts`**
- Extend `SubScore` used by compatibility with `criticalConflicts: string[]` (only compatibility populates it; push a short predator→prey string wherever the existing predator-vs-prey branch fires — keep existing score deduction, reasons, fixes untouched).
- Change `Scorecard.overall` type to `number | null` and add `capReason: string | null`.
- In `scoreTank`: if `state.species.length === 0`, return `overall: null, capReason: null`. Otherwise compute the weighted average as today, then apply caps (take the lowest when multiple fire):
  - `legality.illegalSpecies.length > 0` → cap 30, reason "Score capped: contains species that are illegal to keep in Australia."
  - `bioload.loadPercent > 110` → cap 45, reason "Score capped: the tank is overstocked beyond safe limits."
  - `compatibility.criticalConflicts.length > 0` → cap 40, reason "Score capped: a predator will eat smaller tankmates."
- No changes to sub-score math, weights, reasons, or fixes.

**`src/components/Scorecard.tsx`**
- When `overall === null`: render a neutral dashed placeholder in place of the ring plus the text "Add fish to get a score".
- When `capReason` is set: render it as a small warning line directly under the overall score.
- No other visual changes.

## 2. Ownership via Supabase anonymous auth

**Auth config**: enable anonymous sign-ins.

**Client bootstrap**: on app load, if `supabase.auth.getSession()` is null, call `supabase.auth.signInAnonymously()` and await it before any tank read/write. Wire this into the root route so all queries wait for a session.

**Migration**:
- `ALTER TABLE public.tanks ADD COLUMN user_id uuid DEFAULT auth.uid()` (existing rows stay null; `session_id` column kept).
- Drop `tanks writable by everyone`, `tanks updatable by everyone`, `tanks deletable by everyone`. Keep `tanks readable by everyone` untouched.
- New policies on `tanks`:
  - INSERT `WITH CHECK (user_id = auth.uid())`
  - UPDATE `USING (user_id = auth.uid())`
  - DELETE `USING (user_id = auth.uid())`
- For each of `tank_species`, `tank_plants`, `tank_hardscape`: drop the current write/update/delete policies; keep the public SELECT policy. Add INSERT/UPDATE/DELETE gated by `EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid())`.

**`src/lib/data.ts`**:
- `useSessionTanks` filters by `user_id = (await supabase.auth.getUser()).data.user?.id` instead of `session_id`.
- `saveTank` payload drops `session_id` (DB default fills `user_id`).
- Remove imports of `src/lib/session.ts`.

**Delete `src/lib/session.ts`** and any remaining imports (grep the tree).

**Verify** `/t/$slug` still loads for a non-owner by reading `loadTankBySlug` — it only relies on the public SELECT policies, which are unchanged.

## 3. Vitest scoring tests

- Add `vitest` as devDependency and a `"test": "vitest run"` script.
- New `src/lib/scoring/scoring.test.ts` with inline fixture species (peaceful schooling Amazon tetra, Amazon corydoras, aggressive Malawi mbuna, large predatory Oscar with `predatory: true` + `min_tank_litres: 400`, one `legal_in_australia: false` species). Default tank 100×40×50 cm, filter 1000 lph, weekly maintenance, pH 6.0, 26°C unless noted. Seven cases:
  1. 12 tetras + 6 corys → `overall ≥ 85`, biome badge `"true-biotope"`, compatibility 100.
  2. Empty → `overall === null`.
  3. Oscar + 10 tetras → `criticalConflicts` has a predation entry, `overall ≤ 40`, `capReason` set.
  4. 10 tetras + 5 mbuna, pH 7.0 → biome < 75, compatibility < 90, `capReason === null`.
  5. Illegal species + 10 tetras → legality ≤ 40, `overall ≤ 30`, `capReason` mentions legality.
  6. 60 corys → `loadPercent > 110`, `overall ≤ 45`, `capReason` mentions overstocking.
  7. 3 tetras only → compatibility < 100 with a schooling reason, `overall` is a number, `capReason === null`.
- All 7 must pass; if any fail, fix the gating logic in `scoreTank`, not the tests.

## Order of execution

1. Scoring changes + Scorecard UI update.
2. Migration + auth bootstrap + `data.ts` cleanup + delete `session.ts`.
3. Add vitest and tests; run them; iterate on caps if needed.
