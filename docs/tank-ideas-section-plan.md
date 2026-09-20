# FishTankr Tank Ideas Section Plan

## Summary

Build a separate **Tank ideas** section for aquarium inspiration, templates and SEO landing pages. Each idea should be browsable as its own content page and open directly in the calculator as an editable starting point.

Do not bury templates inside the calculator. The calculator should stay focused on validating a stocking plan. Tank ideas should be the discovery layer that feeds plans into the calculator, visualiser and tank log.

## Product Goals

- Give beginners a clear starting point instead of a blank calculator.
- Create SEO-friendly pages for common aquarium setups.
- Showcase responsible stocking plans that align with FishTankr's welfare positioning.
- Connect inspiration to action through "Open in calculator".
- Support future monetisation through aquarium-shop links, affiliate disclosures and sponsored templates where appropriate.

## Recommended Information Architecture

| Route | Purpose |
|---|---|
| `/tank-ideas` | Main browse page for all templates |
| `/tank-ideas/:slug` | SEO page for one tank idea |
| `/calculator?template=:slug` | Calculator opened with editable template data |
| `/visualiser?template=:slug` | Optional visualiser opened with template data |
| `/species/:id` | Links to tank ideas featuring that species |

Use **Tank ideas** in navigation. It is warmer and more beginner-friendly than "Templates".

## Page Positioning

### Tank Ideas Browse Page

H1: `Aquarium tank ideas`

Supporting copy:

> Start with a stocking idea, then open it in the calculator to check the fit for your exact tank.

Primary CTAs:

- Browse beginner tanks
- Browse by tank size
- Open calculator

### Tank Idea Detail Page

H1 examples:

- `60L beginner community tank idea`
- `Betta fish tank setup for a 20L aquarium`
- `Low-maintenance planted tank for beginners`

Primary CTA:

- `Open in calculator`

Secondary CTAs:

- `Preview in visualiser`
- `Check tank readiness`
- `See species profiles`

## Template Categories

### By Experience

- Beginner
- Easy care
- Intermediate
- Advanced

### By Tank Size

- Nano tanks under 40L
- 40-60L tanks
- 60-100L tanks
- 100-200L tanks
- Large tanks over 200L

### By Style

- Planted tanks
- Low-maintenance tanks
- Community tanks
- Betta tanks
- Shrimp tanks
- Species-only tanks
- Biotope-inspired tanks

### By Goal

- Small apartment aquariums
- Colourful beginner tanks
- Peaceful community tanks
- Desk tanks
- Child-friendly ideas
- Low-light planted tanks

## Initial Template Set

Launch with a small, strong set rather than dozens of shallow ideas.

| Template | Target Query | Notes |
|---|---|---|
| 20L planted betta tank | betta fish tank setup 20L | Beginner-friendly, but explain heater/filter needs |
| 40L shrimp and snail tank | nano shrimp tank idea | Low bioload, visually appealing |
| 60L beginner community tank | 60L community tank stocking ideas | Core SEO target |
| 75L neon tetra planted tank | neon tetra tank setup | Links well to species pages |
| 90L honey gourami community tank | honey gourami community tank | Peaceful centrepiece setup |
| 120L corydoras and tetra tank | corydoras community tank | Good welfare-forward schooling example |
| 180L angelfish community tank | angelfish community tank | Aspirational, but careful with adult size |
| Low-maintenance planted tank | low maintenance aquarium ideas | Content-led evergreen page |
| No-heater coldwater-style tank | cold water aquarium ideas | Needs careful species/legal handling |
| Kids' first aquarium idea | first fish tank for kids | Parent-friendly beginner content |

## Tank Idea Page Content Model

Each tank idea should include:

- Title
- Short summary
- Difficulty
- Minimum tank size
- Suggested dimensions
- Stocking list
- Why it works
- What to watch
- Temperature, pH and hardness range
- Plant suggestions
- Hardscape suggestions
- Filtration notes
- Maintenance rhythm
- Common mistakes
- Region/legal notes where relevant
- Related species
- Related shop directory links if useful
- Open-in-calculator template data

## Template Data Model

### `tank_ideas`

- `id`
- `slug`
- `title`
- `summary`
- `difficulty`
- `minimum_litres`
- `recommended_litres`
- `length_cm`
- `width_cm`
- `height_cm`
- `temperature_min_c`
- `temperature_max_c`
- `ph_min`
- `ph_max`
- `hardness_min_dgh`
- `hardness_max_dgh`
- `category`
- `style_tags`
- `experience_tags`
- `hero_image_url`
- `visualiser_scene_json`
- `calculator_template_json`
- `seo_title`
- `seo_description`
- `status`
- `created_at`
- `updated_at`

### `tank_idea_species`

- `id`
- `tank_idea_id`
- `species_id`
- `quantity`
- `role`
- `notes`

### `tank_idea_sections`

- `id`
- `tank_idea_id`
- `section_key`
- `heading`
- `body`
- `sort_order`

This can also be file-backed at first if the app does not need CMS editing yet.

## Template-to-Calculator Behaviour

When a user clicks **Open in calculator**:

1. Load tank dimensions, volume and species quantities into the shared tank draft.
2. Preserve template attribution in the draft, e.g. `startedFromTemplateSlug`.
3. Show a small notice in the calculator:
   > Started from: 60L beginner community tank. Adjust anything to match your actual setup.
4. Recalculate score using normal calculator rules.
5. Let users edit all values.
6. Offer next steps:
   - Save tank
   - Preview in visualiser
   - Track tank readiness

Important: the template is inspiration, not a guaranteed valid plan for every real tank. The calculator should still validate it.

## SEO Plan

Tank ideas should be one of FishTankr's main organic acquisition channels.

### Page Targets

Create pages for:

- Tank size queries: `60L aquarium stocking ideas`
- Species queries: `betta tank setup`, `neon tetra tank mates`
- Beginner queries: `first fish tank ideas`
- Lifestyle queries: `small apartment aquarium ideas`
- Maintenance queries: `low maintenance aquarium ideas`

### Metadata

Example title:

`60L Beginner Community Tank Idea | FishTankr`

Example description:

`A beginner-friendly 60L aquarium idea with peaceful stocking, plant suggestions, setup notes and an editable FishTankr calculator template.`

### Structured Data

Use:

- `Article` for content-heavy tank idea pages.
- `HowTo` only if the page includes step-by-step setup instructions.
- `FAQPage` only if visible FAQs are present.

### Internal Linking

Every Tank idea should link to:

- Included species pages
- Calculator with template loaded
- Tank log/readiness page
- Related tank ideas
- Relevant beginner guide

Every species page should link back to:

- Tank ideas featuring this species
- Compatible beginner setups
- Community Tank checks involving this species once community launches

## UX Requirements

### Browse Page

Use scannable cards:

- Clear tank image or generated visual
- Tank size
- Difficulty
- Main fish
- "Good for beginners" badge where true
- "Open in calculator" action

Filters:

- Tank size
- Difficulty
- Main fish type
- Style
- Maintenance level
- Planted/non-planted

Sorting:

- Beginner-friendly
- Small tanks
- Most colourful
- Lowest maintenance
- Newest

### Detail Page

Recommended page sections:

1. Hero with tank image and quick facts
2. Stocking list
3. Why this works
4. What to watch
5. Setup and equipment notes
6. Plants and hardscape
7. Maintenance rhythm
8. Open in calculator CTA
9. Related species
10. Related tank ideas

Keep content practical. Avoid fluffy inspiration copy that does not help someone build the tank.

## Example Detail Page Outline

```text
H1: 60L beginner community tank idea

Summary:
A peaceful, colourful starter tank built around small schooling fish and bottom-dwellers.

Quick facts:
- Minimum tank: 60L
- Difficulty: Beginner
- Style: Planted community
- Maintenance: Weekly
- Best for: New fishkeepers who want movement and colour

Stocking:
- 8 neon tetras
- 6 pygmy corydoras
- 1 honey gourami

Why it works:
- The fish use different parts of the tank.
- The stocking stays modest for a beginner.
- The temperature ranges overlap.

What to watch:
- Neon tetras prefer stable, mature tanks.
- Corydoras need sand or smooth substrate.
- Check water hardness before buying.

CTA:
Open this in the calculator
```

## Content Quality Rules

- Do not recommend tanks that rely on edge-case compatibility.
- Do not present minimum tank size as ideal tank size.
- Do not suggest illegal, restricted or invasive species without region-specific warnings.
- Do not make coldwater claims without temperature detail.
- Avoid "cleaner fish" framing.
- Use adult size and group needs, not shop-size assumptions.
- Mention that users must cycle the tank before adding fish.
- Link readiness checks to the Tank log, not the calculator score.

## Visual Strategy

Use images or visualiser-generated scenes where possible.

Each card needs a visual that clearly matches the setup:

- Tank size and style should feel plausible.
- Featured fish should match species.
- Avoid generic reef imagery for freshwater pages.
- Avoid impossible stocking visuals.

If using generated images, keep them illustrative and do not imply exact scale unless generated from the visualiser.

## Analytics Events

Track:

- `tank_ideas_viewed`
- `tank_idea_card_clicked`
- `tank_idea_filter_used`
- `tank_idea_opened`
- `tank_idea_open_calculator_clicked`
- `tank_idea_open_visualiser_clicked`
- `calculator_loaded_from_template`
- `tank_idea_related_species_clicked`
- `tank_idea_related_template_clicked`

## Success Metrics

Organic:

- Impressions and clicks to `/tank-ideas/*`
- Ranking improvements for tank-size and species setup queries
- Click-through to calculator from template pages

Product:

- Calculator starts from templates
- Template edits after opening calculator
- Saves created from templates
- Visualiser opens from templates
- Tank log opens from templates

Quality:

- Bounce rate on template pages
- Scroll depth
- Template-to-calculator completion rate
- Support/community questions generated from templates

## Implementation Phases

### Phase 1: Static Tank Ideas

- Add `/tank-ideas` browse page.
- Add 8-10 manually curated template pages.
- Add "Open in calculator" links with template slugs.
- Add calculator template loading.
- Add species page links to relevant ideas.
- Add SEO metadata.

### Phase 2: Visual and Filter Polish

- Add filters and sort.
- Add hero/card images or visualiser snapshots.
- Add related tank ideas.
- Add analytics events.
- Add "started from template" notice in calculator.

### Phase 3: Community Connection

- Add "Ask for feedback on this idea" CTA.
- Connect Tank ideas to Tank checks.
- Show community Tank checks created from each template.
- Let users publish modified versions of ideas as Tank checks.

### Phase 4: Commercial Layer

- Add optional shop directory links.
- Add affiliate disclosure-aware product suggestions.
- Add sponsored templates only if clearly labelled.
- Add "find supplies near you" cards.

## Lovable Build Prompt

```text
Build a FishTankr Tank ideas section as a separate inspiration and SEO area that feeds into the calculator.

Add routes:
- /tank-ideas
- /tank-ideas/:slug

The /tank-ideas page should browse aquarium setup ideas with cards, filters and clear CTAs. Each card should show the tank size, difficulty, style, featured species and "Open in calculator".

Each detail page should include a useful setup article with quick facts, stocking list, why it works, what to watch, water range, plant ideas, maintenance notes, common mistakes, related species and related tank ideas.

Add support for /calculator?template=:slug so clicking "Open in calculator" loads the template tank size and stocking plan into the editable calculator. The calculator must still run the normal score and validation rules. Show a small notice that the plan started from a template and can be adjusted.

Keep templates separate from the calculator UI except for a small "Need inspiration? Browse Tank ideas" link on the calculator page.

Do not move tank readiness or water parameter tracking into Tank ideas. Link those to the Tank log.
```

