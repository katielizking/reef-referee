## Plan: real Australian legality data

### 1. Migration — add legal_status + legal_note

Single migration on `public.species`:
- Add `legal_status text NOT NULL DEFAULT 'permitted'` with `CHECK (legal_status IN ('permitted','native','prohibited'))`.
- Add `legal_note text` (nullable).
- Backfill all 44 rows in the same migration by matching on `scientific_name`, using the researched values. Set `legal_in_australia = false` where status is `prohibited`, else `true`, so the deprecated column stays consistent.
- Keep `legal_in_australia` in place (unused).

The generated Supabase types regenerate automatically after the migration.

### 2. Scoring engine (`src/lib/scoring/index.ts`)

- Extend `Species` type (`src/lib/types.ts`) with `legal_status: 'permitted' | 'native' | 'prohibited'` and `legal_note: string | null`.
- In `scoreLegality`:
  - Detect illegal via `s.legal_status === 'prohibited'` (replaces the `!legal_in_australia` check). Only prohibited species contribute to `illegalSpecies` and the score deduction.
  - Compute `nativeNotes: string[]` from added species where `legal_status === 'native'` and `legal_note` is set. Native/permitted species score 100 and do NOT trigger the illegality cap in `scoreTank` (already gated by `illegalSpecies.length`).
- Add `nativeNotes` to the `Scorecard.legality` sub-score type.

### 3. Scorecard UI (`src/components/Scorecard.tsx`)

- Leave the existing red "Not legal in Australia" block untouched (still driven by `illegalSpecies`).
- Below it, when `legality.nativeNotes.length > 0`, render a neutral info block (muted background, no warning colour) with heading "Australian natives — check your state's rules:" and the notes as a bulleted list. Purely informational, no score impact.

### 4. Tests

The existing `scoring.test.ts` illegal-species fixture uses `legal_in_australia: false`. Update that fixture to also set `legal_status: 'prohibited'` so the test still exercises the cap. Add one new test: a species with `legal_status: 'native'` and a `legal_note` produces `nativeNotes` with that note, legality score 100, and no cap on overall.

### Out of scope

No changes to tank sizes, temperament, water parameters, or biotope tags. No UI redesign. `legal_in_australia` stays in the schema but is no longer read anywhere in app code.
