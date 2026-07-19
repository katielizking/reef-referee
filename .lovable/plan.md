## Goal

Replace placeholder branding with the Fishtankr identity: new tokens, typography, logo/favicon, hero, and rebranded UI across all existing screens. No functional changes to calculator logic, routes, database, or scoring.

## Scope

Rebrand only. All existing components (`TankSetupPanel`, `Scorecard`, `TankVisual`), routes (`/`, `/saved`, `/t/$slug`), scoring engine, Supabase data flow, and tests stay behavior-identical.

## 1. Design tokens (`src/styles.css`)

Rewrite the `:root` palette to the FishTankr colours (kept as hex/CSS variables, mapped into the existing shadcn `@theme inline` slots so all components inherit automatically):

- `--ink: #12232E` → `--foreground`, headings, nav
- `--blue: #37B8C6` → `--primary`, focus ring, active states
- `--lime: #B8E84A` → `--accent` / success ("Looking good")
- `--coral: #FF7868` → `--destructive` / warning ("Not recommended")
- `--foam: #F4F8F5` → `--background`
- `--white: #FFFFFF` → `--card`, `--popover`, inputs
- Neutral border/muted derived from ink at low opacity
- Add a `--warn` amber-ish token for the middle "Worth another look" state, paired with icon+label (never colour-only)
- Radii: keep rounded system, bump `--radius` to `1rem` for the softer feel
- Remove the `.dark` block usage from the app (keep the class but tuned to the same palette); the brief specifies bright, not dark

Add `--font-display: "Sora"` and `--font-sans: "DM Sans"` (Manrope as fallback). Load both via `<link>` tags in `__root.tsx` head (per Tailwind v4 rules — no URL `@import` in styles.css).

## 2. Logo, favicon, hero visual

Generate three brand assets with the image tool (rounded, minimalist, bright-science territory — no cartoon clownfish, no coral reef):

1. `src/assets/fishtankr-logo.svg.asset.json` — wordmark "FishTankr" in Sora with a small mark (rounded tank silhouette + waterline + bubble) to the left. Freshwater Blue mark on transparent background.
2. `public/favicon.png` — square app-icon variant of the mark only. Delete the default `public/favicon.ico` and wire the new `<link rel="icon">` in `__root.tsx`.
3. `src/assets/hero-tank.png.asset.json` — lightly illustrative modern aquarium diagram (tank outline, waterline, a few simple fish silhouettes, subtle measurement ticks). Placed beside the hero copy.

## 3. Root layout (`src/routes/__root.tsx`)

- Replace the "Fishtankr" text-only header with the new logo (SVG) + wordmark, links styled in Sora.
- Update `TITLE` and meta description to brand voice: "Fishtankr — Smarter tanks. Happier fish." / "Simple tools that make fishkeeping easier to understand and better for the animals in our care."
- Add font `<link>` preconnects + stylesheet for Sora and DM Sans.
- Rebrand 404 and error boundaries with the new voice ("Let's get you back to your tank.").
- Add a simple footer with tagline + disclaimer line: "This is a guide, not a guarantee."

## 4. Home / Builder (`src/routes/index.tsx`)

Insert a compact hero band above the three-column builder (only shown when the tank has no species yet, so it doesn't push the working UI down for returning users):

- H1 (Sora): **Smarter tanks. Happier fish.**
- Sub: Plan your setup, check your stocking and understand the biology behind a healthy aquarium with simple tools built around fish welfare.
- Primary button: **Check my tank** (scrolls to setup panel) — Freshwater Blue
- Secondary button: **Explore the tools** (routes to `/saved`) — white, ink text, soft border
- Hero illustration to the right

Rename the existing `Design your tank` heading to a section label; keep the whole builder layout intact.

## 5. Scorecard result states (`src/components/Scorecard.tsx`)

Rework the overall-score label into three named states (paired with an icon + text, never colour alone):


| Score band                     | Label              | Icon           | Colour       |
| ------------------------------ | ------------------ | -------------- | ------------ |
| ≥ 75                           | Looking good       | check-circle   | Lime Current |
| 45–74 or any cap               | Worth another look | alert-circle   | Amber/warn   |
| < 45 or predation/legality cap | Not recommended    | alert-triangle | Coral Pop    |


Add the standing guidance line under the score: "This is a guide, not a guarantee. Individual species have different space and care requirements." No changes to `scoreTank` numbers or caps.

Rewrite existing warning copy in the brand voice ("That tank may be a little crowded.", "More fish does not always mean a better tank.").

## 6. Component polish

- Buttons: primary = blue bg / white text; secondary = white bg / ink text / 1px ink-10 border; warning = coral. All use the same `rounded-xl`, subtle hover (2–3% darker), visible focus ring in blue.
- Inputs, cards, filter chips: white surface, soft ink-10 border, no heavy shadows.
- Filter chips in `TankSetupPanel` (All/Permitted/Natives/Prohibited) — restyle with new tokens; active chip uses blue.
- Empty states in `/saved`: friendly copy + illustrated placeholder (small SVG of empty tank).
- Tooltips, loading spinners, toasts: inherit new tokens via shadcn variants (no per-component colour edits needed after token swap).

## 7. Copy pass

Rewrite user-facing microcopy in `TankSetupPanel`, `Scorecard`, `/saved`, and shared view to plain Australian English, warm-knowledgeable voice. Avoid puns and alarmist tone. No changes to species/plant/hardscape data.

## 8. Accessibility

- Verify all text/background pairs against WCAG AA (Freshwater Blue on white is borderline for body text — use ink for body, blue only for interactive/large elements).
- All icon-only buttons get `aria-label`.
- Focus rings visible on every interactive element.
- Result states always show icon + text label, never colour alone.

## Out of scope

- No changes to scoring logic, caps, or tests.
- No new routes or features.
- No database or RLS changes.
- No dark-mode redesign (kept but not featured).

## Files touched

- `src/styles.css` (tokens, fonts)
- `src/routes/__root.tsx` (head/fonts/logo/header/footer/404)
- `src/routes/index.tsx` (hero band, copy)
- `src/routes/saved.tsx`, `src/routes/t.$slug.tsx` (copy, empty state)
- `src/components/Scorecard.tsx` (result states, copy)
- `src/components/TankSetupPanel.tsx` (chip styles, copy)
- `src/components/TankVisual.tsx` (colour tokens only)
- `public/favicon.png` (new), `public/favicon.ico` (delete)
- `src/assets/fishtankr-logo.svg.asset.json`, `src/assets/hero-tank.png.asset.json` (new)