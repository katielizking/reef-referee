# Global independent shops directory, plus "find this fish"

Turn the shops directory into a worldwide list of independently owned aquarium
shops, drop every trace of paid placement, and add a way to find a specific
fish for sale near you or delivered to you.

## Where things stand now

- The directory holds 14 shops, all Australian. No shop is marked featured,
  affiliate or claimed, so nothing paid is live today.
- The listing page and the shop page both render a "Featured, paid" badge, an
  "affiliate" link label and a footer note about paid placement.
- Nothing records whether a shop is independent, whether it sells online, or
  where it will ship live fish.

## What changes for people using the site

**A global directory of independents.** Every listing states the country and
city, and carries a short line on why it qualifies as independent. Chains and
franchise pet superstores are out. A note explains the rule plainly so people
can hold us to it, with a link to suggest a shop or flag a wrong listing.

**No paid anything.** Badges, affiliate labels and the paid-placement footer
all go. Nobody pays to be listed, and the page says so.

**Find a fish.** On any fish's page there is a "Where to buy" panel, and the
directory gets a fish search box. You type a fish, we ask once for your
location (with a manual country and state picker if you decline or the browser
refuses), and you get two lists:

- Shops near you that you can walk into.
- Online shops that deliver live fish to your state.

Each result is a single link that runs a search for that exact fish on that
shop's own website, so what you see is their live stock, not our stale copy of
it. We never claim a shop has a fish. The wording is "search their stock",
and results show when each shop's delivery details were last checked.

**Delivery, stated honestly.** Each shop records the countries and states it
ships live fish to, or says pickup only, plus a short note for the awkward
cases such as no live fish into some states. Where we do not know, we say we
do not know rather than guessing.

## Data and technical detail

New columns on `aquarium_shops`, added as a nullable additive migration with
grants unchanged:

- `city`, `region` (free text, for non-Australian addresses)
- `ownership` text, default `independent`; excludes chains at listing time
- `independent_note` text, one line of evidence
- `sells_online` boolean default false, `ships_live_fish` boolean default false
- `ships_to_countries` text[], `ships_to_regions` text[] (ISO country codes and
  state or region codes), `pickup_only` boolean
- `shipping_note` text, `delivery_reviewed_on` date
- `search_url_template` text, containing `{q}` for the species query
- `timezone`/`currency` not needed

`featured`, `is_affiliate`, `affiliate_url` and `claimed_at` stay in the
database untouched but are removed from every type, query and component.

New `src/lib/shop-search.ts`:

- builds a shop search URL from `search_url_template` by URL-encoding the
  scientific name, falling back to the common name, and falling back to the
  shop's website root when no template exists
- `shipsTo(shop, country, region)` and `isNearby(shop, country, region)`
- no fabricated stock claims anywhere

New `src/lib/location.ts`: a small hook that reads a saved country and region
from `localStorage`, offers `navigator.geolocation` with reverse lookup limited
to country and region granularity, and falls back to a picker. Client-only,
read inside `useEffect` so SSR does not mismatch.

Routes:

- `shops.index.tsx` rewritten: global grouping by country, filters for country,
  region, ships-to-me and online-only, plus the fish search box. Search state in
  URL search params so a result is shareable.
- `shops.$slug.tsx`: independence line, delivery coverage, shipping note, last
  checked date, search-their-stock link. No badges.
- `species.$id.tsx`: a "Where to buy" panel reusing the same component.
- `affiliate-disclosure.tsx`: the "Featured shops" section is rewritten to say
  the directory is free and no shop pays for placement, since leaving it would
  now be untrue.

Data: a seed migration converting the 14 existing Australian shops to the new
fields, and adding independently owned shops across the UK, US, Canada,
Germany, the Netherlands, Singapore and New Zealand. Every shop's website,
independence and shipping claim comes from the shop's own site, recorded with
`delivery_reviewed_on`. No invented shops, no guessed shipping policies.

Tests in `src/lib/shop-search.test.ts` cover URL building, encoding, the
no-template fallback, and ships-to matching including a shop that excludes a
state. Scoring engine, tests, AGENTS.md and the 3D code are untouched.
