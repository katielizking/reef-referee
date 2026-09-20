# Blog rebuild: clear out the placeholders, redesign the space, publish one real article

## What you get

1. The four placeholder posts gone from the site and the database.
2. A redesigned blog that matches the rest of FishTankr (paper, ink, water, hairline rules, mono for numbers) instead of the generic rounded-card look it has now.
3. One long, properly researched article: the honest rundown of aquarium stocking calculators people use instead of AqAdvisor, with FishTankr first.

## Clearing out

Delete all four current posts. They are 1.5–1.9 KB stubs and one of them already squats on the AqAdvisor topic, so the new article takes that slot properly. Nothing else links to them.

## The blog index, redesigned

- Full-width masthead: "Field notes" with a one-line standfirst, a hairline rule under it, and the issue-style date line in mono.
- A lead story treatment for the newest post: large cover image, big headline, excerpt, reading time.
- Remaining posts in a ruled list, not cards: date in mono on the left, headline and excerpt on the right, hairline between each.
- Topic filter chips built from the tags actually in use, not a hardcoded list.
- Reading time worked out from word count.
- The "open the builder" invitation moves to the foot of the page, quieter, so the page opens with writing rather than a pitch.

## The article page, redesigned

- Narrow measure (about 68 characters) for comfortable reading, Spectral for body text, mono for figures and captions.
- Cover image full-bleed at the top with the headline over paper below it.
- Auto-built "in this article" contents from the H2 headings, sticky on desktop.
- Reading progress hairline at the top of the window.
- Styled markdown: real blockquotes, ruled tables (the comparison table needs it), captioned images, hairline-boxed callouts.
- Footer: author and date, share links, "related posts" by shared tag, then one builder invitation.
- Prev/next post links.

## SEO

- Article page already has canonical, og tags and BlogPosting data. Adding: `dateModified`, `wordCount`, `articleSection`, a real author, breadcrumb data, and an `ItemList` on the index.
- A generated 1200x630 cover per post, used as the share image.
- Internal links from the article into /calculator, /species, /methodology and the welfare disclaimer, and a link from the calculator page back to the article.
- The sitemap already picks up posts automatically.

## The article

Working title: "Fed up with AqAdvisor? Here's what else is out there (2026)"

Angle: AqAdvisor has been the default for twenty-odd years and its inch-per-gallon lineage shows. Here is what the alternatives actually do, and where each one is weak. Warm, a bit cheeky, no lecturing, no "unlock" or "seamless", Australian English, sentence case, no em dashes.

Shape:

1. Why people go looking (the interface, the "you can add 3 more neon tetras" precision, the missing species).
2. FishTankr first, with the reason stated plainly: it scores welfare rather than volume, keeps headroom qualitative because our capacity model is not calibrated, checks your target pH and temperature against every fish, and flags aggression a litres-and-length formula sails straight past. Stated as our own tool, not pretended otherwise.
3. Each alternative: what it does well, what it does not, who it suits. Candidates found so far, each to be opened and checked before a word is written about it: Aquapacity, App-aquatic, Fish That Fit, aquariumstocking.com, AquaStream, aquariumcalculator.app, FishComfort, Tankstocker.
4. A comparison table: freshwater or marine, species count, invertebrates, units, planted and filtration modelling, free or paid, account needed.
5. What no calculator can do for you: cycling, adult size, the shop's advice, your own eyes on the tank.
6. Close, plus a short honest note that AqAdvisor is still useful for a rough volume sanity check.

Accuracy rules for this piece: every claim about another site comes from that site as it stands when I write it, checked live. No invented species counts, no invented pricing, no claiming a feature is missing without looking. Anything I cannot verify is left out rather than guessed. No claim that FishTankr's numbers are calibrated, because they are not.

## Technical notes

- Posts stay in `blog_posts`; no schema change needed. Deletions and the new row go through the data tools, and the new post also ships as a seed file so a rebuild keeps it.
- Redesign is confined to `src/routes/blog.index.tsx`, `src/routes/blog.$slug.tsx` and a few new presentational components; reading time, table of contents and related posts go in a small `src/lib/blog.ts` with tests.
- Cover images generated at 1200x630 as project assets, referenced by `cover_image_url`.
- Head metadata changes only reach fishtankr.com on the next publish.
