# FishTankr

**Smarter tanks. Happier fish.**

FishTankr is a freshwater aquarium planner for fishkeepers anywhere in the world. Build a tank visually, add livestock, plants, filtration and hardscape, and receive a live welfare-focused assessment with practical recommendations.

## What it does

- Interactive 3D freshwater tank builder
- Tank volume, filter-type and biological-media setup
- Nitrogen-cycle readiness with dated ammonia, nitrite and nitrate readings
- Species compatibility, schooling, aggression and predation checks
- Swimming-space and selected-water checks
- Optional biotope-authenticity feedback that does not affect welfare scoring
- Experimental waste-load screening, clearly separated from the headline score
- Anonymous saved tanks with shareable read-only links
- Species directory, beginner quiz, guides, articles and aquarium-shop listings
- Mobile-first controls with reduced-motion support

## Welfare score

FishTankr currently calculates three weighted welfare categories:

| Category              | Weight |
| --------------------- | -----: |
| Species compatibility |    45% |
| Swimming space        |    35% |
| Water suitability     |    20% |

Cycle and biological-filter readiness is a safety gate rather than a weighted category. An unverified cycle, a filter that is still maturing, stale test evidence, or detectable ammonia or nitrite can cap the overall result. Zero-ammonia and zero-nitrite evidence must be dated within the previous seven days; that is an operational freshness rule, not a guarantee of future water quality.

Biotope authenticity is optional and informational. The inherited `litres / 5` waste-load proxy is also isolated as a beta screening band: it does not affect the headline score, does not treat pump turnover as biological capacity, and never tells a user how many more fish to add. See the in-product methodology page for the current limitations and evidence policy.

Scores are decision support, not a guarantee. Species needs, individual behaviour, aquarium maturity and local animal or biosecurity rules must still be checked.

## Technology

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Tailwind CSS
- React Three Fiber and Three.js
- Supabase with anonymous authentication and row-level security
- Vitest and ESLint
- Bun

## Local development

1. Copy the environment template:

```sh
cp .env.example .env.local
```

2. Add the Supabase URL and publishable key.

3. Install dependencies and start the app:

```sh
bun install
bun run dev
```

Useful checks:

```sh
bun run lint
bun run test
bun run build
```

## PostHog analytics

Set `VITE_POSTHOG_KEY` to the public project token from PostHog project settings and
`VITE_POSTHOG_HOST` to that project's ingestion host (`https://us.i.posthog.com` or
`https://eu.i.posthog.com`). Add both to the deployment's build environment and rebuild.
Never use a personal API key. These `VITE_` values are public browser configuration.

Analytics loads asynchronously in production builds only. Without both values, it does
nothing. Page views include client-side navigation; click tracking masks text and element
attributes. Session recording and person profiles are disabled, URL query strings and
fragments are stripped, and Do Not Track is respected. No Supabase user IDs or emails are
sent explicitly.

To verify, build with the variables configured, run `bun run preview`, visit a few pages
and click a navigation control. Check PostHog's live events for `$pageview` and
`$autocapture`. Test with Do Not Track off and without an analytics blocker. Local `dev`
mode intentionally sends no events. Removing either variable and rebuilding disables it.

## Database

Supabase migrations live in `supabase/migrations`. Apply migrations in chronological order. Saved tanks belong to anonymous authenticated users, while shared tanks are exposed only through a sanitised read-only database function.

Never commit `.env` files or Supabase secret/service-role keys.

## Lovable sync

This repository is connected to the [FishTankr Lovable project](https://lovable.dev/projects/6c43dbbc-b4ba-4ad0-858c-290e909adfd3).

Changes merged into `main` sync back into Lovable. Do not rewrite published Git history, force-push, rebase or amend commits already pushed to the connected branch.
