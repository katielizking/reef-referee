# Platform audit — top recommendations

I audited the Builder, navigation, save/share flow, mobile behaviour, and SEO. The scoring engine and data model are strong; the gaps are almost all in the shell around them. Here's what I'd fix, in priority order.

## What's working well (leave alone)
- Scoring engine, biotope/legality logic, pre-stock checklist copy.
- Route-level SEO on `/`, `/quiz`, `/shops`, `/guides`, `/t/$slug` basics.
- Anonymous auth wiring and saved-tank list mechanics.

## Priority 1 — Critical UX & functional fixes

1. **Mobile: score is buried at the bottom of a long form.**
   On <1024px the three columns stack Setup → Visual → Scorecard, so the user scrolls past a huge fish/plant/hardscape list before seeing whether their tank scores well.
   Fix: on mobile, pin a compact "Overall score" summary bar to the bottom of the viewport (tap to expand the full scorecard in a sheet). Sticky scorecard on `lg+` stays as-is.

2. **Search dropdowns never close.**
   `TankSetupPanel` species/plants/hardscape adders open results on focus but have no outside-click, Escape, or blur handler. Dropdowns stay open over other fields; on mobile the keyboard traps.
   Fix: add outside-click + Escape to close, and close after add.

3. **Tank dimensions accept 0 with no warning.**
   `DimField` allows `0`, producing a 0 L tank that can still be saved and shared.
   Fix: enforce `min=10cm` per side, show red border + helper text below the input, and block Save when litres < 20.

4. **Prohibited species can be added to a tank.**
   The "Prohibited" filter chip surfaces banned species and the "Add" action still works, silently tanking the score after the fact.
   Fix: in the Prohibited view, replace the add button with a "View guide" link and a small "Not legal to keep in AU" note. Keep the filter for education.

5. **No default filter → first save always hits the checklist block.**
   `filter` starts `null`, so any new user with fish gets a blocking "add a filter" fix on their first save.
   Fix: once dimensions are set, auto-select the smallest filter whose rated litres ≥ tank litres; user can change it. Show "auto-picked, tap to change".

## Priority 2 — Accessibility

6. **Icon-only buttons have no accessible names.** `QtyStepper` +/−/trash buttons (used once per row) are silent to screen readers.
   Fix: `aria-label` on the three buttons ("Decrease quantity of {name}", etc.), `aria-hidden` on decorative Lucide icons.

7. **Score rings announce nothing.** The SVG number is inside an `aria-hidden` group.
   Fix: wrap each ring in a container with `aria-label={\`${label} score ${n} out of 100\`}` and `role="img"`.

8. **`TankVisual` SVG has no accessible description.**
   Fix: add `role="img"` + `aria-label` summarising contents (e.g. "Tank preview: 3 species, 2 plants, 1 piece of driftwood").

## Priority 3 — Save & share clarity

9. **"Saved tanks" quietly disappear across browsers/incognito** with no explanation at save time.
   Fix: below the Save button, add a one-liner: "Saved to this browser. Copy the share link if you want to open it elsewhere." After save, show a share-link dialog with a Copy button, not just a toast.

10. **Defensive check on `share_slug`.** `saveTank()` relies on a DB default; if it ever returns null the app builds `/t/undefined`.
    Fix: if `row.share_slug` is falsy, throw a friendly error before navigating.

11. **Hero secondary CTA "Explore the tools" links to `/saved`** — which is empty for first-time visitors.
    Fix: point it at `/quiz` (the actual "find your fish" tool).

## Priority 4 — Discoverability & content

12. **First-time users see three fully-populated panels with no sequencing.**
    Fix: add a tiny 4-step progress strip above the builder ("Dimensions → Filter → Fish → Save"), each step lights up as it's satisfied. Removes the hero CTA duplication.

13. **Empty states missing under each adder.**
    Fix: "No fish yet — search above to add some." (same for plants/hardscape).

14. **Filter/tank size mismatch is only visible deep in the scorecard.**
    Fix: inline warning next to the filter dropdown when rated litres < tank litres.

## Priority 5 — SEO polish

15. Add `canonical` on `species.$id.tsx` (missing) and `og:image` on `t.$slug.tsx` (share previews currently have no image — use a static default from `/public` for now; server-rendered tank preview is a bigger project).
16. Add per-page `twitter:title` / `twitter:description` on the leaf routes that already set `og:*`.

## Out of scope (flag only, no changes this round)
- Second guide article (content, not code).
- Server-rendered tank preview image for social sharing.
- RLS policy audit for `tanks` / join tables.

## Technical notes
- Mobile score bar: new `MobileScoreBar` component rendered from `routes/index.tsx`, uses shadcn `Sheet` for the expand state, `lg:hidden`.
- Dropdown close: extract a small `useOutsideClick(ref, onClose)` hook and reuse in `TankSetupPanel` and `ItemAdder`.
- Progress strip: derive from existing `state` — no new state needed.
- Auto filter: pure function in `src/lib/scoring` or a new `src/lib/defaults.ts`.

Ready to implement all Priority 1–3 items in one pass, and Priority 4–5 in a follow-up — or reorder if you'd prefer something else first.