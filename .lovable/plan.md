## New sections to add to FishTankr

Four new top-level pages, each reachable from the header nav. Order below is the recommended build order (cheapest → most involved).

---

### 1. Cycling your tank guide — `/guides/cycling`

Static, long-form educational content (SEO-friendly). No database.

- New route `src/routes/guides.cycling.tsx` with proper `head()` metadata (title, description, og:title, og:description, canonical).
- Structured sections: What cycling is → Ammonia/Nitrite/Nitrogen cycle diagram → Fishless cycle (recommended) → Fish-in cycle (with welfare warning) → Signs cycling is complete → Common mistakes → When to add fish.
- FAQ block at the bottom with JSON-LD `FAQPage` schema for rich results.
- Cross-links to `/` (builder) and `/species/$id` guides.
- Uses existing FishTankr palette + Sora/DM Sans. Sidebar/anchor TOC for jumping between sections.
- Extensible: `src/routes/guides.index.tsx` as a hub so more guides (algae, water changes, planted tanks) can slot in later without re-planning.

---

### 2. Blog for SEO — `/blog` and `/blog/$slug`

MDX-free markdown-in-DB approach so the user can add posts without redeploying.

- New Supabase table `public.blog_posts`: `id`, `slug` (unique), `title`, `excerpt`, `body_markdown`, `cover_image_url`, `published`, `published_at`, `updated_at`, `author_name`, `tags text[]`, plus SEO fields `meta_title`, `meta_description`.
- RLS: `SELECT` allowed to `anon` + `authenticated` when `published = true`. Writes are locked (admin-only via `user_roles` + `has_role`, so we're future-proof even though no admin UI ships in v1).
- Seed with 4 launch posts targeting Australian aquarium keywords (e.g. "Best beginner fish for a 60L tank in Australia", "Are neon tetras legal in Australia", "How to choose a filter for a planted tank", "AqAdvisor alternatives 2026").
- Routes:
    - `/blog` — list with cover, title, excerpt, tags, date. Loader uses `queryClient.ensureQueryData`.
    - `/blog/$slug` — full post, renders markdown via `react-markdown` + `remark-gfm`. Per-post `head()` with `og:image` from `cover_image_url`, JSON-LD `BlogPosting`.
- Sitemap: add a server route `src/routes/sitemap[.]xml.ts` that enumerates published posts + static routes so Google can crawl them.

---

### 3. What fish should I get? — `/quiz`

Interactive multi-step quiz that recommends 3–5 species from the existing `species` table. Pure client-side scoring; no DB writes.

- New route `src/routes/quiz.tsx` with progress bar + one question per step.
- Questions (7 total, all multiple choice, all shape a scoring vector):
    1. Tank size (litres, bucketed).
    2. Experience level (beginner / some / experienced).
    3. Vibe (peaceful community / colourful showpiece / biotope purist / oddballs).
    4. Water hardness preference (soft / neutral / hard — maps to biome).
    5. Willingness to do weekly maintenance (low / medium / high).
    6. Australian legality strictness (permitted only / natives welcome).
    7. Schooling vs centrepiece preference.
- Scoring: each species gets a match score based on adult size vs tank, biome fit, temperament, legality filter, and care difficulty (derived from existing fields). Reuses logic that already lives in `src/lib/scoring/`.
- Result screen: top matches as cards linking to `/species/$id`, plus a "Start a tank with these" button that pre-seeds the builder via the existing `sessionStorage` `fishtankr:pending-add` mechanism (extended to accept an array).
- No persistence in v1. Optional follow-up: save quiz result against the anonymous auth user.

---

### 4. Nearby aquarium shops map — `/shops`

Highest-effort section — needs a data source and a map library. Australia-only in v1.

Two options for shop data, pick one:

- **Option A — Curated database (recommended for launch).** New table `public.aquarium_shops` with `name`, `address`, `suburb`, `state`, `postcode`, `lat`, `lng`, `website`, `phone`, `specialties text[]` (e.g. planted, marine, rare), `verified_at`. Seed with ~40 known Australian LFS across capital cities. Public `SELECT` policy. Predictable, no API cost, ranks in Google for "aquarium shop {suburb}".
- **Option B — Google Places live search.** Use the Google Maps Platform connector's Places API (New) through the gateway. Fresher data but every visit costs API calls and results are generic (no "planted specialist" tagging).

Recommendation: ship A now, layer B on later as an "also search nearby" enhancement.

- Map lib: Google Maps JS API via the managed connector's browser key (no user setup, referrer-restricted to `*.lovable.app` — fine until custom domain).
- Route `src/routes/shops.tsx`:
    - Left: filter panel (state, specialty chips, search).
    - Right: map with markers; clicking a marker opens a details card.
    - Mobile: list-first with a "Show map" toggle.
- Per-shop detail page `/shops/$id` for SEO (indexable page per store, JSON-LD `LocalBusiness`).
- Geolocation opt-in: "Use my location" button re-centres map and sorts list by distance (Haversine, client-side).

---

### Header nav update

Update `src/routes/__root.tsx` nav to: **Builder · Quiz · Guides · Shops · Blog · Saved**. Collapses to a hamburger on mobile.

### Technical notes for the builder to reference later

- All new content routes get real `head()` metadata — no reused home-page copy.
- `/blog`, `/blog/$slug`, `/shops`, `/shops/$id`, `/guides/cycling`, `/species/$id` all listed in `sitemap.xml` (server route, not static).
- Blog and shops need seed migrations that include `GRANT SELECT ... TO anon, authenticated` before enabling RLS.
- Quiz reuses existing species data — zero new tables.

---

### Suggested build order

1. Cycling guide (1 route, no DB, immediate SEO win).
2. Quiz (1 route, reuses existing data).
3. Blog (1 table + 2 routes + sitemap).
4. Shops (1 table + map integration + connector wiring).

Want me to proceed with all four in this order, or cut/reorder any? Also happy to expand any section (e.g. full question list for the quiz, or the exact seed shop list) before we start.