# Add up to 100 verified independent aquarium shops worldwide

The directory currently holds 29 shops: 18 in Australia, 4 UK, 3 Netherlands, 2 Singapore, 2 New Zealand, 1 US, 1 Canada. Only 20 have a working species search link. This round finds independent shops anywhere in the world that publish a live fish list online, checks each one properly, and adds the ones that pass.

## What counts as a shop we will add

Every one of these must be confirmed from the shop's own live website before it goes in:

1. A public list of live fish for sale, with species names visible on the site.
2. Filters or filtration gear sold on the same site.
3. Independently owned. No chains, no franchise groups, no big-box pet retailers. The evidence line has to say why we believe it is independent, in plain words.
4. A search URL on their site that actually returns fish results when we put a species name in it.
5. Country and city we can state, taken from their own contact or about page.

Anything that fails a single one of those is dropped from this round rather than added with a gap. No paid placements, no affiliate links, the directory stays free.

## How the work runs

- Discovery: web search plus scraping, sweeping country by country across North America, Latin America, Europe, the UK, Africa, the Middle East, Asia and Oceania, in batches. Existing 29 shops are excluded by domain and by name so nothing is duplicated.
- Verification: for each candidate, fetch the homepage, the live fish or livestock section, the filtration section, the contact or about page, and run one real species search against the search URL. Record what was seen and the date it was checked.
- Shops that fail verification are recorded in a working notes file with the reason, not added to the site. That gives a re-check list for later rounds without polluting the directory.
- Target is up to 100 new shops. If fewer than 100 pass the strict bar, we add the ones that pass and report the real number. We will not pad the count.

## What lands in the project

- A new seed file, `supabase/seed/aquarium_shops_global_round2.sql`, with one row per verified shop: slug, name, city, region, country code, website, specialties, description, ownership, independence evidence note, online and live-fish-delivery flags, shipping notes, verified search URL template, review date, coordinates. `ON CONFLICT (slug) DO NOTHING`, same as the existing seed.
- The same rows applied to the live database so they appear on the site immediately.
- Working notes listing every rejected candidate and why, kept out of the shop pages.
- Nothing changes in the scoring engine, species data, 3D code or the shops UI. The existing `/shops` page, country grouping and "Where to buy" panel already handle these fields.

## Checks before finishing

Species search on a handful of the new shops through the live "Where to buy" panel, then lint, tests, typecheck and build.

## Caveats worth knowing

- This is slow work. Each shop needs several page fetches and a live search, so it runs in batches and will use a fair number of credits.
- Some countries have very few independents with public online stocklists, so the final spread will be uneven and weighted towards English-language and European markets.
- Delivery flags are only set where the shop states it plainly. Where live fish shipping is unclear, the listing says so rather than guessing.
