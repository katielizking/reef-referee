-- Shop ownership audit.
--
-- The directory promises to leave chains out, but chain rows stayed in the
-- table and were reachable by URL (Petbarn's page said "Chain retailer" and
-- "Independently owned" at once), and a blanket "not part of a chain" note was
-- copied onto every shop that had no evidence of its own.

-- 1. Mark chains we can recognise: known chain and franchise brands, and
--    listings whose own description calls them a chain.
UPDATE public.aquarium_shops
SET ownership = 'chain'
WHERE ownership IS DISTINCT FROM 'chain'
  AND (
    name ~* '\m(petbarn|petstock|pet stock|city farmers|pets at home|pets corner|maidenhead aquatics|petsmart|petco|pet valu|animates|petland|pet supplies plus|pet supermarket|kmart|big w|bunnings)\M'
    OR slug ~* '(petbarn|petstock)'
    OR (
      description ~* '\m(chain retailer|retail chain|national chain|chain store|pet superstore)\M'
      -- "not a chain store", "no chain" and similar describe an independent shop.
      AND description !~* '\m(not|no|never|isn''t)\M[^.]{0,30}\m(chain|superstore)'
    )
  );

-- 2. Remove chains from the directory. Their outbound click events cascade.
DELETE FROM public.aquarium_shops WHERE ownership = 'chain';

-- 3. Drop blanket ownership notes that say nothing about the particular shop.
--    Mirrors isGenericOwnershipNote in src/lib/shop-search.ts.
UPDATE public.aquarium_shops
SET independent_note = NULL
WHERE independent_note ~* '^\s*(a\s+)?(single\s+)?(independent(ly owned)?|independently run)(\s+(store|shop|business))?[,.]?\s*(not part of a (chain|retail group)( or franchise( group)?)?)?\.?\s*$'
   OR independent_note ~* '^\s*not part of a (chain|retail group)';

-- 4. Independence without shop-specific evidence is not confirmed.
UPDATE public.aquarium_shops
SET ownership = 'unverified'
WHERE ownership = 'independent'
  AND (independent_note IS NULL OR btrim(independent_note) = '');

-- 5. New listings start unconfirmed until someone checks who owns them.
ALTER TABLE public.aquarium_shops ALTER COLUMN ownership SET DEFAULT 'unverified';
