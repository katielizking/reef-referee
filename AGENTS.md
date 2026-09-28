<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Product claims

Claims about how FishTankr scores a tank must match `scoreTank` in
`src/lib/scoring`. When scoring behaviour changes (what feeds the score, the
weights, the caps), update every claim about it in the same change:

- the calculator results copy (`src/components/Scorecard.tsx`)
- the methodology page (`src/routes/methodology.tsx`; weights come from `WEIGHTS`)
- species pages, guides and the welfare disclaimer (`src/routes`)
- the shared wording in `src/lib/two-checks.ts` and `src/lib/species-evidence.ts`
- blog posts. These live in the database, so edit `supabase/seed/` **and** add a
  migration that updates the published row, or the live article keeps the old claim.

`src/lib/product-claims.test.ts` fails on claims that waste load or cycling
feed the score, or that every species carries a source. Extend it when you add
a new kind of claim.
