# Aqua Score

Build a web app for freshwater fishkeepers that lets someone design a tank, add livestock, plants, filtration and hardscape, and get an instant score on how good the setup is. Think of it as a modern, visual, Australian-localised version of the old AqAdvisor stocking calculator, but with a scoring engine that goes well beyond stocking percentage.

Stack and setup

Use React with Tailwind. Use Supabase for the database and for anonymous session storage (no login required in v1 — I want zero friction). Enable GitHub sync so I own the code. Deploy so I have a live URL.

Core user flow

User sets tank dimensions (length x width x height in centimetres) and sees live litres.

User picks a filter from a list and sets a maintenance frequency (weekly, fortnightly, monthly).

User adds fish species from a searchable list, each with a quantity.

User adds plants and hardscape items (rocks, driftwood, substrate type, leaf litter).

A live scorecard on the right updates in real time as they build, showing five scores plus an overall.

User can save the tank (stored to Supabase against an anonymous session id) and generate a shareable read-only link to that tank.

Data model (Supabase tables)

species

id, common_name, scientific_name

min_tank_litres, adult_size_cm

bioload_factor (a number, roughly proportional to waste output)

swim_zone (top, mid, bottom)

temperament (peaceful, semi-aggressive, aggressive)

is_schooling (bool), min_group_size (int)

fin_nipper (bool), predatory (bool)

native_ph_min, native_ph_max, native_temp_min_c, native_temp_max_c

biotope_region (e.g. "amazon_blackwater", "lake_malawi", "se_asian_stream", "australian_native")

native_habitat_type (e.g. "still_blackwater", "rocky_rift_lake", "flowing_stream")

legal_in_australia (bool) — flag species banned or restricted from import/keeping in Australia

plants

id, common_name, biotope_region, light_need (low, med, high)

hardscape

id, name, type (rock, wood, substrate, leaf_litter), biotope_region

filters

id, name, rated_litres, turnover_lph

tanks

id, session_id, name, length_cm, width_cm, height_cm, filter_id, maintenance_frequency, created_at

tank_species (join)

tank_id, species_id, quantity

tank_plants, tank_hardscape (joins with tank_id and item id)

Seed the database with at least 40 common freshwater species, tagged across at least four biotope regions (Amazon blackwater, Lake Malawi rift, Southeast Asian stream, Australian native), plus 15 plants and 15 hardscape items tagged the same way. Include a handful of species flagged legal_in_australia = false so the localisation feature is visible.

Scoring engine

Show five sub-scores (0–100 each) and one overall score (a weighted average). Each sub-score must show a short plain-English reason and, where it's low, a suggested fix.

1. Species compatibility (weight 25%) Check every pair of added species for: temperament clashes, fin-nipper plus long-finned tankmate, predator plus small-enough-to-eat tankmate, and non-overlapping pH or temperature ranges. Also flag any schooling species kept below its min_group_size. Start at 100 and deduct per conflict.

2. Bioload (weight 20%) Estimate biological capacity from litres, filter turnover, plant density and maintenance frequency. Sum the bioload_factor x quantity of all fish. Score is how comfortably capacity exceeds load. Over 100% load scores low; 70–85% scores highest (a healthy buffer). Show the load as a percentage too.

3. Space to swim (weight 20%) Compare each species' min_tank_litres and adult_size_cm against actual tank volume and footprint (length x width). Penalise active or large species in tanks with too little floor space or length, even if bioload is fine. A 10cm active fish in a tall narrow tank should score poorly here.

4. Biome replication (weight 25%) — this is the signature feature Score how faithfully the tank recreates one real-world biotope:

Biotope cohesion (largest share): reward all species sharing one biotope_region; penalise geographic scatter.

Water authenticity: reward tank target pH/temp matching the dominant biotope's native ranges.

Hardscape and substrate match: reward decor whose biotope_region matches the fish.

Plant authenticity: reward plants matching the biotope; penalise mismatches. Award a "True biotope" badge when every species shares one region and the score clears 85.

5. Australian legality (weight 10%) If any added species has legal_in_australia = false, score drops sharply and the scorecard shows a clear warning naming the species and that it can't be legally kept or imported in Australia.

Screens

Builder (main screen): left panel for tank setup and searchable add-lists; centre shows a simple side-view visual of the tank with fish represented as labelled shapes sitting in their correct swim zone (top/mid/bottom) and plants/hardscape drawn in; right panel is the live scorecard.

Saved tanks: list of this session's saved tanks.

Shared view: read-only version of a tank and its scorecard at a shareable URL.

Keep the centre visual simple and clean for now (2D side view, shapes and labels, fish placed by swim zone). Do not attempt photorealistic or animated rendering yet.

Design direction

Clean, modern, calm. Lots of whitespace, rounded cards, a soft aquatic palette (deep blues, teals, sand tones). Mobile-friendly and responsive. Sentence case throughout. It should feel like a considered modern product, not a dated utility.

Out of scope for v1 (do not build)

No user accounts or login. No 3D or AR. No animation. No saltwater, reef or brackish. No maintenance logging or reminders. No payments or affiliate links. No AI image generation.

Build the database and scoring engine first, then the builder UI around it, then the save-and-share flow last.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6c43dbbc-b4ba-4ad0-858c-290e909adfd3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
