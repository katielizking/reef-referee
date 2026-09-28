-- Correct product claims in the AqAdvisor comparison article.
-- The score is compatibility, space and water only (WEIGHTS in
-- src/lib/scoring); waste load is a beta band beside it, cycling lives in the
-- tank tracker, and many fish profiles have no source link yet. Each replace
-- is a no-op when its sentence has already been changed.
UPDATE public.blog_posts
SET body_markdown = replace(replace(replace(replace(body_markdown,
    $c$The score is built from compatibility, bioload, space and water, and that last one is the part almost nothing else checks.$c$,
    $c$The score is built from compatibility, space and water, and that last one is the part almost nothing else checks.$c$),
    $c$Our capacity model is the inherited litres per five centimetres of fish rule and it has never been calibrated, so headroom stays a sentence, not a number.$c$,
    $c$Waste load is shown as a rough beta band beside the score and never changes it. The estimate compares each species' waste factor with an inherited litres-divided-by-five reference that has never been calibrated, so headroom stays a sentence, not a number.$c$),
    $c$- 201 freshwater fish and 31 shrimp, snails and crabs, each row carrying its source link.$c$,
    $c$- 201 freshwater fish and 31 shrimp, snails and crabs. Each fish profile says whether its care data and Australian status have been checked against a source, and says "Not verified" where they have not.$c$),
    $c$- Cycling, substrate, heater, light and CO2 are all checked, because new tank syndrome kills more beginner fish than every compatibility mistake put together.$c$,
    $c$- Substrate, heater, light and CO2 are checked beside the score, and the [tank tracker](/tracker) tells you when the tank has cycled and is ready for fish, because new tank syndrome kills more beginner fish than every compatibility mistake put together.$c$),
  updated_at = timezone('utc', now())
WHERE slug = 'aqadvisor-alternatives';
