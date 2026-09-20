# Closing the gap with AqAdvisor

AqAdvisor is the tool most beginners land on first. It wins on coverage and a few practical outputs, and loses on honesty and design. The aim is not to copy it. It is to stop losing people for reasons that have nothing to do with welfare advice: their fish is missing, their tank is measured in gallons, or they wanted a water change number and did not get one.

## What AqAdvisor does that FishTankr does not

Confirmed by reading the current data model and scoring engine.

1. **Species coverage.** AqAdvisor lists thousands of fish plus shrimp, snails and crayfish. FishTankr has 118 fish and no invertebrates at all. A missing fish means the user leaves.
2. **Gallons.** Entry is centimetres and litres only. US and UK visitors cannot use the tool as-is.
3. **More than one filter.** A tank holds exactly one filter here. Most real tanks run two, or a filter plus a sponge.
4. **A water change recommendation.** AqAdvisor prints "change x% weekly". FishTankr collects maintenance frequency but never gives a number back.
5. **A stocking percentage the user can point at.** Our load percentage exists but is labelled experimental and kept out of the result, so people read no number at all.
6. **"What else can I add?"** AqAdvisor suggests compatible additions. We deliberately refuse to name a number of extra fish, but we never offer compatible species either.
7. **A shareable, printable report.** Share links exist; there is no plain print or PDF summary to take to the shop.
8. **Tank shapes.** Rectangles only. No bowfront, cube, corner or column, which changes footprint and surface area.
9. **Lighting, heater and CO2.** Not modelled, so plant and temperature advice stays generic.
10. **Substrate and preferences per species.** Sand-sifters and cory-type fish need fine substrate; nothing captures this.

## What we should not copy

- AqAdvisor's inch-per-gallon lineage. Our capacity model is already honest about being unvalidated; a headline "stocking %" must stay clearly a screen, not a verdict.
- Its saltwater and reef mode. Out of scope for a freshwater welfare tool.
- Its "you can add 3 more neon tetras" precision. We keep headroom qualitative.

## Plan, in order of what wins the most users per unit of work

### Phase 1 — Stop losing people at the front door

- **Units toggle.** Litres and centimetres, or gallons and inches, remembered per person. Conversion at the display layer only; scoring stays metric.
- **Multiple filters.** Tanks hold a list of filters rather than one, each with its own media level and maturity. Readiness reads the combined media; flow is reported, never treated as filtration.
- **"Fish not listed" capture.** A short form on the livestock search when a search returns nothing, so we learn which species to research next. Never auto-creates a species row.

### Phase 2 — Give people the numbers they came for

- **Water change guidance.** A recommended weekly percentage and a plain sentence, derived from stocking level, plant density and filtration, shown beside maintenance frequency.
- **Stocking level, surfaced honestly.** Show the load percentage and band in the scorecard with a clear "screen, not a verdict" label, still excluded from the overall score.
- **Print and share report.** A print stylesheet plus a one-page summary of tank, stock list, verdict, issues and shopping actions, reachable from the scorecard and from a shared link.

### Phase 3 — Coverage

- **Invertebrates.** Shrimp, snails and crayfish added as their own catalogue with their own compatibility rules: fish that eat shrimp, crayfish that eat fish, copper and temperature limits. Sourced and cited like every other row.
- **Species expansion in reviewed batches.** Target the fish beginners actually search for, in batches of roughly 25, each batch shipping FishBase size and range plus Seriously Fish husbandry, with source, review date and confidence, and shipping as a migration.
- **Compatible-species suggestions.** For the current plan, a short list of species that clear every compatibility, space and water rule, with the reason each fits. No quantities suggested.

### Phase 4 — Physical accuracy

- **Tank shapes.** Bowfront, cube, corner and column, each with its own volume and footprint maths feeding the space score.
- **Substrate preference.** A per-species substrate requirement, checked against the chosen substrate.
- **Heater, light and CO2.** Recorded, used for temperature and plant feasibility rather than shown as equipment badges.

## Technical notes

- Species and invertebrate data changes ship as migrations as well as rows, because the live table (118) and the migrations (44) have already drifted once.
- A units preference lives client-side; every stored dimension stays centimetres and every stored volume litres.
- Multiple filters needs a `tank_filters` join table with media level and maturity per row, replacing `tanks.filter_id`; keep the old column readable during the move so saved tanks and shared links do not break.
- Invertebrates need a sibling table, not rows in `species`, so the fish scoring rules are not quietly applied to a shrimp.
- Every scoring behaviour change adds its case to `src/lib/scoring/scoring.test.ts` in the same change, including the monotonicity rule: a suggestion feature must never make adding fish raise the score.
- Water change guidance is derived, not stored, and must be phrased as a starting point, not a prescription.

## Suggested first step

Phase 1 on its own: units, multiple filters and the missing-fish capture. It is the smallest change that makes the tool usable for people AqAdvisor currently keeps.
