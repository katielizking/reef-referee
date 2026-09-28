-- Species name clashes.
--
-- Two different species were both called "Glowlight rasbora", and
-- "Channoides betta" read like a variant of the Betta rather than its own
-- species. Look-alike species keep separate pages; the site now says which
-- fish they are not (src/lib/species-names.ts).

UPDATE public.species
SET common_name = 'Red-line rasbora'
WHERE lower(btrim(scientific_name)) = 'trigonopoma pauciperforatum'
  AND lower(btrim(common_name)) = 'glowlight rasbora';

UPDATE public.species
SET common_name = 'Snakehead betta'
WHERE lower(btrim(scientific_name)) = 'betta channoides'
  AND lower(btrim(common_name)) = 'channoides betta';

-- One common name, one species. Skipped with a notice, rather than failing
-- the migration, if other clashes already exist; list them with:
--   SELECT lower(btrim(common_name)), array_agg(scientific_name)
--   FROM public.species GROUP BY 1 HAVING count(*) > 1;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.species
    GROUP BY lower(btrim(common_name)) HAVING count(*) > 1
  ) THEN
    RAISE NOTICE 'species_common_name_unique not created: duplicate common names remain';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS species_common_name_unique
      ON public.species (lower(btrim(common_name)));
  END IF;
END $$;
