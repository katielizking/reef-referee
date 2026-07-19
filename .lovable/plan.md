
# Fishtankr — build plan

A freshwater aquarium designer that scores tanks in real time on compatibility, bioload, swim space, biome authenticity, and Australian legality. No login in v1.

## Build order

1. **Database + seed data** (Supabase)
2. **Scoring engine** (pure TS, unit-testable in isolation)
3. **Builder UI** wired to the engine
4. **Save + share** flow

## 1. Database (Supabase migrations)

Tables exactly as specced. Notes:

- `session_id` on `tanks` is a client-generated UUID stored in `localStorage` (anonymous session). No auth in v1.
- `tanks` gets an extra `share_slug` (short random string, unique) for the shareable URL, plus `target_ph`, `target_temp_c` (user-chosen water params used by biome scoring), and `plant_density` (`none | light | medium | heavy`).
- All lookup tables (`species`, `plants`, `hardscape`, `filters`) are readable by `anon`. `tanks` and the three join tables are readable/writable by `anon` but every row is scoped by `session_id` in the query layer. Share reads go through a public server function that only returns rows for a given `share_slug`.
- Grants added for every public-schema table per Supabase rules. RLS enabled; policies allow anon full access to lookup tables (SELECT only) and to `tanks`/joins (SELECT/INSERT/UPDATE/DELETE — v1 has no auth, so scoping is by `session_id` in queries; documented as a v1 tradeoff).

**Seed data** (in the same migration):
- 40+ species across 4 biotopes: Amazon blackwater (e.g. cardinal tetra, neon tetra, corydoras, angelfish, discus, ram cichlid, hatchetfish), Lake Malawi rift (yellow lab, demasoni, rusty cichlid, peacock, mbuna variants), SE Asian stream (cherry barb, harlequin rasbora, betta, kuhli loach, otocinclus proxy, honey gourami), Australian native (pacific blue-eye, empire gudgeon, murray river rainbow, desert goby, purple-spotted gudgeon).
- A handful with `legal_in_australia = false` (e.g. neon tetra is fine, but flag some restricted species like piranha, snakehead, alligator gar, wild-type Betta imbellis, etc. — verified against DAFF restricted list at seed time).
- 15 plants tagged by biotope (Amazon swords, java fern for SE Asian, Vallisneria for Aus native, hornwort as generic, etc.).
- 15 hardscape items (Seiryu stone, dragon stone, Malawi holey rock, Amazonian driftwood, spider wood, Indian almond leaves, blackwater botanicals, sand, aquasoil).
- 8–10 filters (small internal, HOB range, canister range) with realistic `rated_litres` and `turnover_lph`.

## 2. Scoring engine

Pure functions in `src/lib/scoring/`. No React, no Supabase — takes a `TankState` and returns a `Scorecard`. Unit-testable.

```
scoreTank(state) -> {
  overall: number,
  compatibility: SubScore,
  bioload: SubScore & { loadPercent: number },
  space: SubScore,
  biome: SubScore & { badge?: 'true-biotope', dominantRegion?: string },
  legality: SubScore & { illegalSpecies: string[] },
}
SubScore = { score: 0-100, reasons: string[], fixes: string[] }
```

Weights: 25 / 20 / 20 / 25 / 10.

- **Compatibility**: pairwise loop. Deductions: temperament clash (-15), fin-nipper + long-finned tankmate (-15), predator + prey-size tankmate (adult_size ratio > ~2x, or prey adult < predator mouth heuristic) (-25), pH range non-overlap (-10 per pair), temp range non-overlap (-10 per pair). Per-species schooling shortfall (-10 each). Floor at 0.
- **Bioload**: capacity = `litres * (turnover_factor) * (plant_factor) * (maintenance_factor)`. Load = `Σ bioload_factor * quantity`. `loadPercent = load / capacity * 100`. Score curve peaks 70–85% (=100), drops off either side; ≥100% falls fast, ≥130% near zero.
- **Space**: for each species, check `tank_litres >= min_tank_litres`, footprint length ≥ ~6× adult size for active species, ≥ ~4× for sedentary. Penalise per violation, weighted by quantity.
- **Biome**: compute dominant `biotope_region` by species headcount share. Cohesion sub-part = share of species in dominant region. Water authenticity = overlap of user's `target_ph` / `target_temp_c` with dominant region's aggregated native range. Hardscape and plant authenticity = share of items matching dominant region. Weighted mix. Award **True biotope** badge iff all species share one region AND score ≥ 85.
- **Legality**: 100 if all legal. If any illegal, drop to `max(0, 100 - 60 * illegalCount)` and surface species names in `reasons`.

Every sub-score returns short plain-English `reasons` and, when < 80, actionable `fixes` ("Add 4 more cardinal tetras to reach the school minimum", "Neon tetra is restricted in Australia — remove it").

## 3. Builder UI

TanStack Start route `/` (replaces the placeholder). Three-column responsive layout that stacks on mobile:

- **Left**: tank dimensions (three number inputs) + live litres readout; target pH and temp sliders; filter picker (dropdown); maintenance frequency (segmented control); plant density (segmented control); searchable add-panels for species, plants, hardscape with quantity steppers on added rows.
- **Centre**: 2D SVG side-view of the tank. Fish drawn as labelled rounded shapes placed by `swim_zone` (top/mid/bottom bands). Plants as simple green silhouettes at the substrate line. Hardscape as grey/brown blobs. Substrate colour reflects chosen substrate. Clean, static, no animation.
- **Right**: live scorecard. Overall score up top (big ring), then five sub-score cards, each with score, reason line, and expandable fixes. True biotope badge when awarded. Australian legality warning card is prominent when triggered.

Design tokens in `src/styles.css`: soft aquatic palette (deep blue, teal, sand, off-white), rounded-2xl cards, generous whitespace, sentence case, Inter or similar. Mobile: single column, scorecard collapses to a sticky bottom summary that expands.

## 4. Save + share

- "Save tank" button writes `tanks` + join rows scoped to the anonymous `session_id` (UUID in `localStorage`). Generates `share_slug` on first save.
- **Saved tanks** route `/saved`: lists tanks for the current session.
- **Shared view** route `/t/$slug`: read-only. Fetches by `share_slug` via a public server function (`/api/public/*` not needed since it's a GET server fn with narrow anon SELECT policy on `tanks` by slug). Same centre visual + scorecard, no edit controls.

## Deployment

Uses Lovable Cloud (Supabase managed) and Lovable's built-in publish. GitHub sync is enabled via the Lovable UI — I'll note the steps in the final message; it's a user action, not a code change.

## Out of scope (per spec)

No auth, no 3D/AR, no animation, no saltwater/brackish, no maintenance reminders, no payments, no AI images.

## Technical section

- **Stack**: TanStack Start (project default), React 19, Tailwind v4, Supabase via Lovable Cloud.
- **Data access**: browser Supabase client for lookup reads and session-scoped tank writes; one `createServerFn` (`getSharedTank`) using a server publishable client for the public share view, backed by a narrow `TO anon` SELECT policy on `tanks` filtered by `share_slug` plus its join tables.
- **Routes**: `/` (builder), `/saved` (session tanks), `/t/$slug` (shared read-only). Each has its own `head()` metadata.
- **Session id**: `crypto.randomUUID()` stored under `fishtankr.session_id` in `localStorage`, lazy-created on first mutation.
- **Scoring engine**: `src/lib/scoring/{index.ts, compatibility.ts, bioload.ts, space.ts, biome.ts, legality.ts, types.ts}`. Pure, no I/O.
- **Testing**: a handful of Vitest cases for the scoring engine covering: incompatible pair, schooling shortfall, over-bioload, cross-biotope penalty, illegal species, and True biotope award.
- **State**: local React state for the working tank (no need for Zustand at this size). TanStack Query for species/plants/hardscape/filters lookups and saved-tank reads.
- **Security note**: v1 tank writes are anon-scoped by client-supplied `session_id`. Anyone with a `share_slug` can read a tank (that's the point). Documented as a known v1 tradeoff; can be tightened when auth is added.

## Open questions worth flagging before I build

- The Australian restricted list changes over time. I'll seed against the current DAFF live-import list at build time and mark the source in a comment; happy to swap in a specific list you provide.
- "Plant density" isn't in the spec but the bioload formula needs it — I'm adding it as a simple segmented control (none/light/medium/heavy). Say if you'd rather derive it purely from the number of plants added.
