
## Goal

Give every fish its own page that explains its needs and how FishTankr scores it, reachable from the species list in the builder.

## Route

New file `src/routes/species.$id.tsx` at URL `/species/$id` (uses the species UUID — no schema change needed).

- Loader uses `context.queryClient.ensureQueryData` to fetch the single species by id from Supabase.
- `notFoundComponent` for unknown ids; `errorComponent` for fetch failures.
- `head()` sets per-page title/description/og tags from the loaded species (common + scientific name, biotope, adult size).

## Page content

Four sections, using existing brand tokens and components — no new design system work.

1. **Header**
   - Common name (H1, Sora) + scientific name (italic).
   - Badges: biotope region, `legal_status` (Permitted / Australian native / Prohibited — coral for prohibited, lime for native, muted for permitted, always paired with label + icon).

2. **At a glance** (grid of stat cards)
   - Adult size (`adult_size_cm`)
   - Minimum tank (`min_tank_litres`)
   - Swim zone (top / mid / bottom)
   - Temperament
   - Group size (if `is_schooling`, "Schools of X+"; else "Can be kept singly")
   - Native pH range and temperature range

3. **Welfare notes** — plain-English bullets derived from the row:
   - Schooling requirement, if any.
   - Fin-nipper / long-finned / predatory warnings.
   - Native habitat description (`native_habitat_type`).
   - `legal_note` when present (state-permit warning for natives, prohibition reason for restricted species).

4. **How the calculator uses this species** — one short paragraph per sub-score, explaining what the engine looks at (compatibility flags, bioload factor, min-tank + swim length, biotope match, legality). Written from the species' perspective ("Because this fish is a fin-nipper, it dings compatibility when kept with long-finned tank mates.") so the guide answers "why did my score change?"

5. Disclaimer footer: "This is a guide, not a guarantee. Individual fish vary." (matches the Scorecard voice.)

## Linking from the builder

Edit `src/components/TankSetupPanel.tsx` only:
- In each species search result row, add a small "View guide" affordance (info icon `Link` from `lucide-react`) on the right side that navigates to `/species/$id` in a new tab. Clicking the row body still adds the fish — the icon has `stopPropagation` + `aria-label`.
- In each added-species chip, add the same info-icon link next to the remove button.

No changes to the scoring engine, database, saved-tanks, or shared-view routes.

## Files touched

- `src/routes/species.$id.tsx` — new.
- `src/components/TankSetupPanel.tsx` — add two info-icon links.

## Out of scope (say so up front)

- No `/species` index page.
- No new columns (uses only existing species fields).
- No slug column — URL uses the UUID for now; can add a slug later without breaking anything.
- No changes to how the Scorecard renders.
