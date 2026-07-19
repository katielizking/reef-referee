# FishTankr UX/UI Audit — Prioritised Recommendations

Based on desktop + mobile screenshots of Builder, Quiz, Guides, Shops, Saved, plus a read of the surrounding components. Findings grouped by severity, roughly in the order I'd ship them.

---

## P0 — Fix now (blocks the core "design a tank" flow)

**1. Builder-on-mobile: the actual tool is 2+ scrolls below the fold.**
The hero (`KNOW BEFORE YOU STOCK / Smarter tanks…`) currently renders above the builder on every visit, so on 390 px the first three viewports are hero, then "Design your tank" heading, then the setup form — the 3D scene and scorecard are far below. Fix: on `/`, show the hero only when the user has zero saved tanks *and* has never opened the builder (localStorage flag), and add a "Skip to builder" anchor. Even better: replace the hero with a compact top strip ("New here? Start from a preset →") that opens a Sheet.

**2. Left setup rail is a 7-section wall.**
Tank / Water target / Filtration / Plant density / Fish / Plants / Hardscape all stack in one column and force ~1200 px of scroll before anything else appears. The scorecard on the right is calm, but the left rail sets the tone as "form-heavy". Fix: convert the left rail into a stepped accordion with three groups — **Tank & water** (dimensions, pH/temp, filtration, density), **Livestock** (fish), **Aquascape** (plants, hardscape). Only "Livestock" is expanded by default. Each group shows a one-line summary when collapsed ("90×40×45 · 162 L · AquaClear 50 · weekly").

**3. Fish/Plants/Hardscape are three separate searches — should be one tabbed "Add" panel.**
The three search boxes and three empty-state chips are visually identical and stack; users have to know which section a species goes in. Fix: a single "Add to tank" card with tabs `Fish · Plants · Hardscape`, sharing one search input and result list style. Reduces vertical space by ~40% and creates one obvious "add stuff" moment.

**4. No progress / no first-move signposting in the builder.**
An empty builder shows every panel at once. There is no "you're here → next step" guidance. Fix: a slim 4-step strip above the scene — `1 Set tank · 2 Pick filter · 3 Add livestock · 4 Aquascape` — each step lights up when its condition is met, and the current step's setup group is auto-expanded.

**5. Scorecard: sub-score labels look like they say "BIOLOAD · 20%" is the score.**
The weight (25%, 20% …) sits next to the metric name in the same size and colour, and the actual score sits below. Real users misread this. Fix: move the weight to a small pill on the right (`weight 20%`) or below the metric as tertiary text, so the big number is unambiguously the score. Also add a `/100` suffix on the overall ring for clarity.

---

## P1 — High-impact polish

**6. 3D scene needs camera presets and a legend.**
The hint text "Drag to rotate · scroll to zoom · click objects to edit" is fine but users can't recover a good angle once they've spun it. Fix: three tiny camera buttons in the scene toolbar — **Front · Iso · Top-down**. Also add a one-line legend when nothing is selected, e.g. "🐠 fish · 🌿 plants · 🪨 hardscape — tap to edit".

**7. Pre-stock check is a chevron that most people won't open.**
On mobile it's a single "No fish yet" chip; on desktop it's a collapsed card. When there *are* fish, the actionable warnings hide behind that chevron. Fix: auto-expand the checklist as soon as it has any warning or block; on desktop show the first two issues inline with a "See all" affordance. Give the checklist a distinct accent colour when it contains a critical block (matches the score-cap logic).

**8. Save/Share buttons don't reflect state.**
"Save" and "Share" are always fully enabled and identical-weight. Users hit Share on an empty tank and get a link to nothing. Fix: disable both when `state.species.length === 0`; when a save gate is triggered, replace the Save button with "Fix issues to save" (opens the checklist). Also add a small "Saved" toast and inline "Copy link" state after share.

**9. Filter chips (`All · Permitted · Native · Prohibited`) are hidden inside the Fish section.**
Users often want to browse natives without knowing the section exists. Fix: promote the biotope filter to the top of the unified Add panel from item 3, and add a `Biotope` filter alongside (Amazon, Malawi, SE Asia, Australian).

**10. Species discovery has no index page.**
Species guides exist at `/species/$id` but there's no `/species` list. Users can only find them by adding a fish and clicking through. Fix: add `/species` with a filterable grid (by biotope, temperament, size) that links to guides. Big SEO win too.

**11. Header wraps to two rows on mobile.**
Six top-nav items don't fit; the current wrap looks unbalanced. Fix: hamburger sheet on <sm, or collapse to `Builder · Quiz · More▾`.

**12. Header lacks active-page indication on desktop.**
Only the current-page chip has a faint background; hover states on the others are also chips, so scanning is noisy. Fix: subtle underline for the active route and no chip background on rest state.

---

## P2 — Content, discovery, and depth

**13. `/guides` looks like a placeholder.**
Only one card ("Cycling your tank"). The heading promises "deep-dive articles" but delivers one. Fix: add categories with cards even if some are marked "coming soon" (Water chemistry · Filtration · Plants · Fishless cycle · Quarantine), and cross-link relevant guides from the builder's help text and species pages.

**14. `/shops` — no combined map, and state filter overlaps search.**
Every card links to its own map; there is no overview map. State chips + search box both filter the same list but visually compete. Fix: single Leaflet map above the list with pins for all filtered shops, and merge search + state into one toolbar row.

**15. `/quiz` feels sparse — huge whitespace on desktop and no imagery.**
One question card floats on a mostly-empty screen. Fix: give it a two-column layout on ≥ md with a decorative aquarium illustration or a running "your answers so far" panel; add a proper progress bar (7 dots or a filled line).

**16. `/saved` has no starter templates.**
"No saved tanks yet" is a dead end. Fix: below the empty state, show 3–4 preset tanks ("60 L community", "20 L cherry shrimp nano", "180 L Malawi", "40 L SE Asian blackwater") that instantiate a state in the builder with one click.

**17. Blog index has no visible traffic-driver.**
Not audited in detail — but no featured post, no categories, no author, no "read next". If SEO is a goal, blog needs a proper article template with hero image, TOC and related-post rail.

---

## P3 — Craft & consistency

**18. Empty states are inconsistent.**
Fish/plants/hardscape rails all show a pale grey pill ("No fish yet — search above…"), the scene shows a hint bar, the scorecard shows a dashed ring, `/saved` shows an icon+CTA, `/guides` and `/quiz` have nothing. Unify: a single `<EmptyState icon title body cta>` component used everywhere.

**19. Section headings in the left rail are 12 px uppercase caps — hard to scan.**
Bump to 13 px with slightly more letter-spacing, or replace with sentence-case bold to match the rest of the app's Sora headings.

**20. Footer is one line.**
Add: About · Contact · Privacy · Method (how scoring works) · Sitemap link. Increases perceived depth and helps SEO.

**21. Copy nits.**
- "Tap any fish, plant or décor to edit it." Only shows once you're on the page — turn it into an overlay hint that appears the first time hover is detected, then fades.
- "162 L" volume label sits on its own line — consider inline: `162 L · about 43 US gal` for the imperial-minded.
- "AUSTRALIAN LEGALITY · 10%" — soften to "Legality (AU)".

**22. Accessibility gaps to sweep next pass.**
- The 3D scene needs a text-mode fallback list for screen readers ("This tank contains 6 neon tetras, 4 corydoras…").
- Score rings should expose `role="img"` with an aria-label of the numeric value.
- Toolbar icon buttons (undo/redo/reset) need `aria-label`s.

---

## Suggested first sprint (P0 only, ~1 day of build)

1. Left rail → stepped accordion with summaries.
2. Unified `Add to tank` card (Fish/Plants/Hardscape tabs + one search).
3. 4-step progress strip.
4. Mobile hero → dismissable/first-visit-only, plus "Skip to builder".
5. Scorecard: weight-vs-score visual fix; `/100` on overall.

Ship those five together and the builder should feel dramatically less form-y without any change to the scoring engine or data model.
