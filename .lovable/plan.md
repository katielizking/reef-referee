# FishTankr audit and recommendations

Advice only. Nothing here is implemented until you approve a build.

## 1. Blockers before anything else

- `main` is broken at runtime: the engine rewrite landed without the components that read it. `Scorecard.tsx` and `PreStockChecklist.tsx` still expect a `legality` sub-score the new engine no longer returns, so the scorecard throws as soon as a tank is scored. PR #1 is the fix. Nothing below matters until that is merged.
- Saving is also broken. `src/lib/data.ts` writes ten cycle and water-test columns (`cycle_status`, `cycle_method`, `filter_maturity`, `tank_age_weeks`, `ammonia_mg_l`, `nitrite_mg_l`, `nitrate_mg_l`, `water_tested_on`, `seeded_media`, `biological_media_level`) that do not exist on the `tanks` table, which currently fails the build at `data.ts:142` and `data.ts:152`. Fix: one migration adding those columns to `public.tanks` with the existing owner-scoped grants and policies untouched, and matching fields in the shared-tank read function so a shared link still returns cycle evidence. First job of the build pass, ahead of the banner.
- CI cannot catch this class of break. `.github/workflows/quality.yml` runs test, build and an advisory lint, but `bun run build` is plain `vite build`, which strips types without checking them. Add a `tsc --noEmit` step and make it blocking.
- Lint is `continue-on-error: true` with a formatting backlog. Run one formatting-only pass, then make lint blocking.
- The site is not published, so every recommendation below about search and sharing is currently theoretical.

## 2. Design

The visual identity is strong and distinctive: deep ink, freshwater blue, lime, coral, Sora and DM Sans. Keep it. Weak points:

- The score is the product, but it is presented as five equal-looking rings in a right-hand column. It should read as one verdict with supporting detail: a single headline state (safe / risky / do not stock), then the sub-scores.
- The 3D tank is beautiful and expensive, and it currently competes with the score for attention. On mobile it dominates while the score is squeezed into a bar.
- Three-column desktop layout collapses into a long scroll on mobile with the scorecard last. Fish welfare advice ends up below the fold.
- No empty-state illustration for a tank with no fish, and no visual language for severity beyond colour. Criticals need an icon and shape difference, not only red.

## 3. UX

- Score explanation is thin. Every issue now carries a `reason` and a `fix`; those should be the primary content, grouped criticals first, with the number as secondary.
- No undo affordance discoverability beyond a keyboard hint, and no onboarding tour of the 3D editor.
- Saving is anonymous with no recovery path. If a user clears their browser, their tanks are gone and there is no warning saying so.
- Share links are read-only but there is no "remix this tank" call to action on the shared view for the visitor, which is the main growth loop you already half-built.
- The quiz, guides, blog and shops exist but are not connected to the builder. A quiz should end in a pre-filled tank.
- Nineteen of the 118 species cannot live in the app's own default tank of pH 7.0 and 25 degrees. A user picking a default tank and a discus gets flagged with no explanation of the default. Defaults should adapt to the first species chosen, or the default should be explained.
- Headroom is deliberately qualitative, which is correct, but users will read "some room" as permission. Word it as what happens to the fish.

## 4. Commercial gaps

Chosen direction: donations plus shop affiliates.

- No support surface at all today. A dismissible WIP banner with a Ko-fi $5 AUD button is the first commercial artefact. Placement: a slim bar under the header, dismissed state remembered in local storage, plus a permanent quieter link in the footer.
- The shop directory is the natural revenue engine and is currently pure cost. It needs an outbound-link click model, a "featured listing" flag on the shop row, and a claim-this-shop contact path.
- Affiliate links need disclosure and `rel="sponsored nofollow"` on outbound commercial links, which the directory does not do yet.
- No email capture anywhere. A single "tell me when tank saving gets accounts" field is the cheapest asset you can build now.
- Species pages are the long-tail traffic and the obvious place for gear and stock affiliate slots.
- No analytics on the score itself. You cannot tell which failures users hit most, which is the data that should drive the roadmap.

## 5. Website compliance gaps

- No privacy policy, no terms, no cookie or storage notice. You store anonymous auth sessions and saved tanks, so Australian Privacy Act disclosure applies once you publish and accept donations.
- No welfare disclaimer page. The README says decision support not a guarantee; that sentence needs to be in the product, near the score.
- No affiliate or sponsorship disclosure, required by ACCC guidance once shop listings are paid or referral-based.
- No `robots.txt` in `public/`.
- `sitemap.xml` has an empty `BASE_URL`, so it emits relative or malformed entries.
- Every route's `canonical` and `og:url` is relative (`/`, `/species`, `/blog`). Crawlers need absolute URLs. Only `blog.$slug` sets an `og:image`.
- No contact route, no attribution page for the 3D model licences, which the model licences require.
- Species data policy is sound (source_url, reviewed_on, confidence) but not surfaced to users, which is your strongest credibility asset.

## 6. Marketability

- The differentiator is welfare, not stocking percentage. The homepage says "Smarter tanks. Happier fish." but never shows the AqAdvisor comparison that makes the point. A short "what other calculators miss" section, using your own reference cases (two male bettas in a 40 L: other tools say fine, FishTankr says critical), is the highest-value marketing content you own.
- Methodology page is a trust asset and should be linked from the score, not buried in the footer.
- Region positioning is contradictory: the README opens by calling FishTankr Australian-focused while the code has been deliberately de-regionalised. Pick one story. Recommended: global welfare scoring, Australian local-rules reference material clearly labelled.
- Shareable score cards as images would be the single biggest organic reach lever and do not exist.
- No open-source or WIP narrative, which is exactly what a Ko-fi banner can carry: honest, in-progress, community-supported.

## 7. Recommended order of work

1. Merge PR #1. Add blocking `tsc --noEmit`. Format once, make lint blocking.
2. WIP banner with Ko-fi support button, plus footer link.
3. Compliance pass: privacy, terms, welfare disclaimer, affiliate disclosure, 3D attribution, `robots.txt`, absolute canonical and og URLs, sitemap base URL.
4. Score presentation rework: one verdict, issues grouped criticals first, methodology link beside it.
5. Growth loop: remix call to action on shared tanks, quiz ends in a pre-filled tank, shareable score image.
6. Shop monetisation: featured flag, outbound click tracking, disclosure, claim path.
7. Debt from the project notes: capacity model, conspecific fields, cycling model, biotope regions.

## Technical notes

- Banner: new component rendered in `src/routes/__root.tsx` above the header, dismissal in local storage under a `fishtankr:` key, Ko-fi link `https://ko-fi.com/fishtankr` with `target="_blank" rel="noopener noreferrer"`, styled with existing tokens only.
- Compliance pages: new leaf routes with their own `head()` including absolute canonical against `https://reef-referee.lovable.app` until a custom domain exists.
- Absolute URLs: introduce one `SITE_URL` constant and use it in every route `head()` and in `sitemap[.]xml.ts`.
- No region-specific strings in shared code; Australian rules stay in labelled reference material.
