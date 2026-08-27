# Design audit and art direction overhaul

## What the app looks like right now

The build reads as competent template work rather than a designed product. The tells, in order of how obvious they are:

- **Everything is a white rounded card floating on a tinted page.** Same radius, same soft shadow, same border, from the hero to the species grid to the scorecard. Nothing has hierarchy because everything has the same container.
- **Two corner radial gradient blobs** behind the page (lime top-left, blue top-right) plus a dot grid plus a faint grid pattern in the hero. This exact combination is the most recognisable generated-page signature there is.
- **Palette is untuned.** Teal + lime + coral on near-white reads as generic "friendly SaaS". The lime is used as an accent everywhere and never carries meaning.
- **Icon-in-a-pill labels** (`o AQUARIUM PLANNING, DECODED`, `o LIVE AQUARIUM`, `o LIVE REFEREE`) repeated at the top of every block. Same treatment, no variation, so they stop being informative.
- **Two-line stacked hero with two buttons and an illustration on the right.** The illustration is a flat outline tank that does not match the real 3D tank sitting 400px below it, so the page shows the product twice in two different visual languages.
- **Species grid is four uniform photo cards per row** with three identical grey chip badges under each. Every card has a "SPECIES VERIFIED" overlay that adds nothing. Missing photos fall back to a pale outline fish icon, so the grid visibly breaks rhythm.
- **Filters are three rows of pill chips**, all identical weight, taking a full screen band before any content.
- Copy has generated cadence: em dashes, "research-grade observations", "Aquarium planning, decoded".

## Artistic direction to commit to

**"Field notebook meets water."** FishTankr is an instrument that tells you whether fish will live. It should look like a marine biologist's working document: measured, ink-on-paper, with water as the only place colour and softness are allowed. Dry surfaces are flat and precise. Wet surfaces (the tank, the score, anything live) are the only things that glow, blur or move.

This gives a rule that kills the AI look on its own: **no gradient, blur or glow anywhere except inside the water.**

### Palette, retuned

Keep the ink, deepen and desaturate the rest so the accents mean something.

- Ink `#0F1D26` — all type, all rules, all borders. Borders become 1px ink at 12%, hairline, not soft grey.
- Paper `#F2F0EA` — warm off-white, replaces the cool mint `#F4F8F5`. Warm paper against cold water is the whole tension of the design.
- Water `#1F7F8C` — deeper than the current teal, used only for live/wet things.
- Verdict green `#4E7A3A`, caution amber `#B4761F`, critical `#A83A2C` — the three score states, muted and earthy, not fluorescent.
- Lime is retired as a decorative accent and kept only as `#C9E86A` inside the tank glass for plant matter.

### Type

- Headings: keep a geometric display face but drop the letter-spacing tricks; set headlines large, tight, left, and stop stacking two short lines with a hard break.
- Introduce a monospace for every number, unit, dimension, score and species code (`90 × 40 × 45 cm`, `162 L`, `pH 7.0`, `40/100`). Data in mono against prose in sans is the single strongest human-designer signal available and it suits an instrument.
- Scientific names in italic serif, not italic sans, so the field-guide voice is carried by type rather than by a badge.

### Structure moves

1. **Kill the card grid.** Sections are separated by full-bleed bands and hairline rules, not by floating rounded boxes. Panels that remain (setup, scorecard) get square-ish 4px corners, a hard 1px ink border, and no shadow.
2. **Remove the background blobs, the dot grid and the hero grid.** Replace with one device: a **faint measurement ruler** running down the left gutter, with centimetre ticks, echoing the tank dimensions. It is the page's only ornament and it is literal to the product.
3. **Hero becomes the product.** Delete the flat outline tank illustration. The live 3D tank is the hero, cropped wide and full-bleed, with the headline set over the water and the verdict number sitting on the glass. One page, one tank, one visual language.
4. **Scorecard as an instrument panel, not five rings.** One large mono verdict number with a state word, then the four welfare sub-scores as horizontal ruled bars in a stacked table with mono values, criticals pulled to the top with a solid ink-red left rule. Biotope sits below the rule, clearly labelled as a style goal.
5. **Species cards become field-guide plates.** Photo cropped tall, ink hairline frame, name in sans, scientific name in italic serif beneath, and stats as one mono line (`11 cm · semi-aggressive · min 150 L`) instead of three chips. Drop the "SPECIES VERIFIED" overlay. Missing photos get a hand-drawn-feeling silhouette plate in ink on paper, so gaps look intentional rather than broken.
6. **Filters collapse** into a single ink rule with inline text toggles, so the grid starts near the top of the page.
7. **Legality and prohibited flags** get a stamp treatment — rotated ink outline, letterpress feel — rather than a coral pill. It reads as a document annotation, which is what it is.
8. **Motion**: only water moves. Slow caustic light on the glass, score numbers tick up in mono, everything else is instant. No fade-up-on-scroll.

### Copy pass

Rewrite hero, section headings and empty states to Australian English, sentence case, no em dashes, no "decoded"/"research-grade". Say what happens to the fish.

## Technical notes

- All of the above lands in `src/styles.css` tokens plus the `@layer components` block (`fishtankr-panel`, `science-label`, `hero-grid`, `site-shell::before`, `depth-card`) and the presentation layer of `BrandLogo`, `Scorecard`, `MobileScoreBar`, `TankSetupPanel`, `BuilderSteps`, `SpeciesPortrait`, `species.index.tsx`, `species.$id.tsx`, `index.tsx`.
- Add a mono font and an italic serif via `<link>` in `src/routes/__root.tsx` (not `@import` in CSS).
- New semantic tokens: `--paper`, `--water`, `--verdict-good`, `--verdict-caution`, `--verdict-critical`, `--rule`, `--font-mono`, `--font-scientific`. Components keep using tokens only, no hardcoded colours.
- No scoring, data, Supabase or 3D behaviour changes. The 3D scene is reused in the hero, not rewritten.
- Dark mode retuned as ink paper rather than inverted mint.

## Suggested order

1. Tokens, fonts, and removal of the blobs/dot grid/soft shadows — this alone changes the read of every page.
2. Scorecard instrument panel.
3. Hero as live tank.
4. Species plates and filter rule.
5. Copy pass and stamps.
