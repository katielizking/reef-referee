# Fix false predation warnings

## Problem

The predation check in `src/lib/scoring/index.ts` flags any `predatory` fish that is at least 2.5 times the smaller fish's adult length as a **critical** "large enough to swallow" risk. The Betta (7 cm, `predatory: true`) versus the celestial pearl danio (2.5 cm) trips this at a 2.8 ratio, but a betta is a micropredator with a small mouth and cannot swallow a deep-bodied adult danio. The rule currently fires on 2,120 species pairs across 26 predators, so the betta is not the only borderline case.

The user has approved unlocking the scoring engine for this fix.

## Change

Turn the single predation threshold into a two-band rule in `src/lib/scoring/index.ts`:

- **Swallow risk (critical, weight 60)** only when the predator is at least **4 times** the prey's adult length (e.g. alligator gar versus tetra). Wording stays "large enough to swallow".
- **May see as food (medium, weight ~15)** at ratios between 2.5 and 4, with honest wording: the predator "may see smaller tank mates as food, especially young or newly introduced fish", and the fix suggests supervision and cover rather than rehoming.
- Below 2.5, no issue, as today.

This removes the false "swallow" claim for betta + celestial pearl danio (they move to the medium band) while keeping genuine gape predators at critical. Behaviour summary (`criticalConflicts`) only includes critical-band pairs.

## Tests (`src/lib/scoring/scoring.test.ts`, same change)

- Betta-style case: 7 cm micropredator versus 2.5 cm prey produces no critical `predation` issue, only the medium "may see as food" issue.
- Large-predator case: ratio at or above 4 still produces the critical `predation` issue and appears in `criticalConflicts`.
- Existing "caps a predator and prey combination" test updated to use a ratio at or above 4 (its intent, real predation, is unchanged; the fixture values change).

## Docs

- `AGENTS.md` predation note updated to describe the two-band rule (kept in the same change as the engine edit, per project rules).
- `src/routes/methodology.tsx` predation description updated to match, if it quotes the 2.5 rule.

## Data

No species rows change in this pass. The betta stays `predatory: true` (accurate; it is a predator, just a small-mouthed one). A separate, sourced audit of the other 25 predators' flags can follow later if wanted.

## Verification

- `bunx vitest run` (full suite), `tsgo --noEmit`, lint, and `bun run build`.
- Manual check in the calculator: betta + celestial pearl danio no longer shows a critical swallow warning; gar + tetra still does.

## Technical notes

- Rule lives in the pairwise compatibility loop around line 467 of `src/lib/scoring/index.ts`; issue codes stay `predation` (critical) plus a new code in `IssueCode` for the medium band.
- Per project rules, any new issue code that resolves by changing a quantity must also join `GROUP_CODES`; this one resolves by removing a species, so it stays out.
