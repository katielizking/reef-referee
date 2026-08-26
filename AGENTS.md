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

# FishTankr

FishTankr tells people whether the aquarium they are planning will keep its fish
alive. Someone will read the score, buy the fish, and put them in the water. That
is the whole standard this codebase is held to.

## Rules that are not negotiable

**Never invent a species value.** Not adult size, not minimum tank volume, not
temperature range, not group size, not temperament. If you cannot cite where a
number came from, do not add the row. A plausible-looking number is worse than a
missing one, because nobody checks a number that looks right.

**Every species field needs a source in the same change.** Populate
`source_url`, `reviewed_on` and `confidence` alongside the value. FishBase is the
base layer for size, range and distribution. Seriously Fish is the better source
for husbandry, is copyrighted, and is therefore cited and never copied.

**Widen nothing.** A temperature or pH range must never be broader than the
source it came from. Padded ranges are how the compatibility checks quietly stop
firing, and padding always errs towards telling the user their tank is fine.

**Do not default a group size.** `min_group_size` of 6 was applied across the
board once and it was wrong nearly every time. Published guidance for most
shoaling species is 8 to 10. Look it up per species.

**No region-specific content in shared code.** No Australian legality strings, no
country assumptions in scoring, types, or components. Local rules belong in
clearly labelled, per-jurisdiction reference material.

**The live database is not the repo.** Species have been added directly to
Supabase without matching migrations, so the two have drifted. Any data change
ships as a migration as well, or it will vanish the first time the database is
rebuilt.

## The scoring engine

`src/lib/scoring/index.ts`. Read `scoring.test.ts` before touching it. The
following properties are enforced by tests and each one exists because the
engine once got it wrong:

- **The score never rewards adding fish.** The only permitted exception is
  easing a group-size problem, such as completing a shoal. Every other rise is a
  bug. Bioload holds at 100 up to the plateau and only ever falls after it.
- **The bioload curve is continuous.** No branch boundaries, no cliffs.
  Users cannot be told their score dropped five points for adding one tetra.
- **Aggressive plus aggressive is a critical conflict**, including two of the
  same species, and including a part-group of an aggressive shoaling fish.
- **Biotope is never part of the welfare score.** It is a style goal reported
  beside the score. `WEIGHTS` contains compatibility, bioload, space and water,
  and nothing else.
- **`unmapped` is a bucket, not a habitat.** It scores zero cohesion and can
  never earn a biotope badge. Roughly a third of the species table sits in it.
- **The tank's own pH and temperature are checked against every species.**
- **Never quote a specific number of extra fish a user could add.** The capacity
  model is still the inherited `litres / 5` rule and has never been calibrated
  against real tanks. Headroom stays qualitative until it has been.

Issues carry a stable `code`. Add new codes to `IssueCode`, and add any code a
user resolves by changing a quantity to `GROUP_CODES`, or the monotonicity test
will correctly fail.

## Known debt, in priority order

1. The capacity model ignores surface area and biological media volume and uses
   turnover as a proxy for filtration. Turnover is not filtration.
2. There are no fields for conspecific rules: `max_males`, `sex_ratio`,
   `territory_cm2`, and a crowd threshold for mbuna. Aggression rules are
   currently inferred from `temperament` and `min_group_size`.
3. Nothing models cycling. New tank syndrome kills more beginner fish than every
   compatibility mistake combined, and no competitor scores it either.
4. Five biotope regions cannot express Central America, West Africa, Tanganyika,
   Victoria, India, North America or brackish.

## Working style

Small changes, each one testable. If you change scoring behaviour, add the case
to `scoring.test.ts` in the same change. Run `bun run lint`, `bun run test` and
`bun run build` before pushing. Do not update the baseline to make a failing test
pass without saying why in the commit message.
