# FishTankr

**Smarter tanks. Happier fish.**

FishTankr is an Australian-focused freshwater aquarium planner. Build a tank visually, add livestock, plants, filtration and hardscape, and receive a live welfare-focused score with practical recommendations.

## What it does

- Interactive 3D freshwater tank builder
- Live tank volume and filtration calculations
- Species compatibility, schooling and predation checks
- Bioload and swimming-space scoring
- Biotope replication scoring
- Australian legality and native-species notices
- Anonymous saved tanks with shareable read-only links
- Species directory, beginner quiz, guides, articles and aquarium-shop listings
- Responsive controls with reduced-motion support

## Scoring model

FishTankr calculates five sub-scores and a weighted overall score:

| Category | Weight |
| --- | ---: |
| Species compatibility | 25% |
| Bioload | 20% |
| Swimming space | 20% |
| Biotope replication | 25% |
| Australian legality | 10% |

Critical welfare or legality issues can cap the overall result. Scores are guidance, not a guarantee; fishkeepers should verify current species requirements and applicable state and federal rules.

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

## Database

Supabase migrations live in `supabase/migrations`. Apply migrations in chronological order. Saved tanks belong to anonymous authenticated users, while shared tanks are exposed only through a sanitised read-only database function.

Never commit `.env` files or Supabase secret/service-role keys.

## Lovable sync

This repository is connected to the [FishTankr Lovable project](https://lovable.dev/projects/6c43dbbc-b4ba-4ad0-858c-290e909adfd3).

Changes pushed to `main` sync back into Lovable. Do not rewrite published Git history, force-push, rebase or amend commits already pushed to the connected branch.
