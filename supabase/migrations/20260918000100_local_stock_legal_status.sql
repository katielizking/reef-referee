-- Add a legal status for fish that are kept in Australia but are not on the federal
-- permitted import list, then correct rows that were wrongly described as listed.
--
-- Checked against the DAFF permitted live freshwater ornamental fish list
-- (effective 17 May 2024) on 18 Sept 2026.
--
-- "not_importable" means: not on the import list, so any fish sold here must come from
-- local breeding. It does not claim the fish is established locally, and it does not
-- claim possession is prohibited. Welfare scoring is unaffected.

ALTER TABLE public.species DROP CONSTRAINT IF EXISTS species_legal_status_check;
ALTER TABLE public.species
  ADD CONSTRAINT species_legal_status_check
  CHECK (legal_status IN ('permitted', 'native', 'not_importable', 'prohibited'));

-- 1. Existing rows that are not on the permitted list
UPDATE public.species
SET
  legal_status = 'not_importable',
  legal_note = v.note,
  legal_import_status = 'not_permitted',
  legal_possession_status = 'check_state_rules',
  legal_source_label = 'Australian Government (DAFF) permitted live freshwater ornamental fish list, effective 17 May 2024',
  legal_source_url = 'https://www.agriculture.gov.au/sites/default/files/documents/list-permitted-live-freshwater-ornamental-fish-suitable-for-import.pdf',
  legal_reviewed_on = DATE '2026-09-18',
  legal_confidence = 'medium'
FROM (VALUES
  ('Otocinclus vittatus', 'Not on the DAFF permitted list. Only Otocinclus arnoldi is listed. Otos sold locally are often misidentified, so the species you buy may differ.'),
  ('Chindongo demasoni', 'Not on the DAFF permitted list under this or its older genus names. Any available in Australia would be from local breeding.'),
  ('Maylandia estherae', 'Maylandia is not on the DAFF permitted list. Any available in Australia would be from local breeding.'),
  ('Maylandia lombardoi', 'Maylandia is not on the DAFF permitted list. Any available in Australia would be from local breeding.'),
  ('Cynotilapia afra', 'Not on the DAFF permitted list. Any available in Australia would be from local breeding.'),
  ('Boraras brigittae', 'Not on the DAFF permitted list. Only Boraras maculatus is listed. We have not confirmed that local stock exists.'),
  ('Danio margaritatus', 'Not on the DAFF permitted list. We have not confirmed that local stock exists.')
) AS v(sci, note)
WHERE public.species.scientific_name = v.sci;

-- 2. Siamese algae eater: listed under its current name, Crossocheilus oblongus
UPDATE public.species
SET
  legal_note = 'Listed on the DAFF permitted list as Crossocheilus oblongus (Siamese algae eater). C. siamensis is an older name for the same fish.',
  legal_source_label = 'Australian Government (DAFF) permitted live freshwater ornamental fish list, effective 17 May 2024',
  legal_source_url = 'https://www.agriculture.gov.au/sites/default/files/documents/list-permitted-live-freshwater-ornamental-fish-suitable-for-import.pdf',
  legal_reviewed_on = DATE '2026-09-18'
WHERE scientific_name = 'Crossocheilus siamensis';

-- 3. Care data corrections flagged in review
UPDATE public.species SET swim_zone = 'bottom'
WHERE scientific_name = 'Otocinclus vittatus';

UPDATE public.species
SET min_tank_litres = 200, is_schooling = false, min_group_size = 1,
    conspecific_strategy = 'territorial',
    conspecific_notes = 'Tolerant when young but becomes territorial with age. Keep one, or a group of 3 or more in a large tank.'
WHERE scientific_name = 'Crossocheilus siamensis';

UPDATE public.species SET fin_nipper = false
WHERE scientific_name = 'Danio rerio';

-- 4. Popular locally bred species that could not be added as "permitted"
WITH new_species (common_name, scientific_name, min_tank_litres, adult_size_cm, bioload_factor, swim_zone, temperament, is_schooling, min_group_size, fin_nipper, predatory, long_finned, active, native_ph_min, native_ph_max, native_temp_min_c, native_temp_max_c, biotope_region, native_habitat_type, conspecific_strategy, conspecific_notes, legal_note) AS (
  VALUES
  ('Bristlenose catfish', 'Ancistrus cf. cirrhosus', 100, 12, 2.6, 'bottom', 'peaceful', false, 1, false, false, false, false, 6.0, 7.8, 20, 27, 'south_american_river', 'flowing_stream', 'territorial', 'Males defend caves. One male per tank unless it is large with plenty of caves. Needs wood to rasp.', 'Ancistrus is not on the DAFF permitted list. Bristlenose are widely bred in Australia, so buy locally bred fish.'),
  ('Convict cichlid', 'Amatitlania nigrofasciata', 150, 12, 3.0, 'bottom', 'aggressive', false, 1, false, true, false, false, 6.5, 8.0, 20, 28, 'central_american_river', 'flowing_stream', 'pair', 'Breeds readily and defends fry fiercely.', 'Not on the DAFF permitted list. Kept in Australia from local breeding.'),
  ('Firemouth cichlid', 'Thorichthys meeki', 150, 15, 3.5, 'bottom', 'semi-aggressive', false, 1, false, true, false, false, 6.5, 8.0, 24, 28, 'central_american_river', 'vegetated_margin', 'pair', 'Mostly bluff but territorial when breeding.', 'Not on the DAFF permitted list. Kept in Australia from local breeding.')
)
INSERT INTO public.species (common_name, scientific_name, min_tank_litres, adult_size_cm, bioload_factor, swim_zone, temperament, is_schooling, min_group_size, fin_nipper, predatory, long_finned, active, native_ph_min, native_ph_max, native_temp_min_c, native_temp_max_c, biotope_region, native_habitat_type, conspecific_strategy, conspecific_notes, legal_note,
  legal_in_australia, legal_status, legal_import_status, legal_possession_status, legal_source_label, legal_source_url, legal_reviewed_on, legal_confidence, care_source_label, care_confidence)
SELECT n.*,
  true, 'not_importable', 'not_permitted', 'check_state_rules',
  'Australian Government (DAFF) permitted live freshwater ornamental fish list, effective 17 May 2024',
  'https://www.agriculture.gov.au/sites/default/files/documents/list-permitted-live-freshwater-ornamental-fish-suitable-for-import.pdf',
  DATE '2026-09-18', 'medium',
  'Draft values from general hobby references. Not yet checked against a primary source.', 'low'
FROM new_species n
WHERE NOT EXISTS (
  SELECT 1 FROM public.species s
  WHERE lower(s.scientific_name) = lower(n.scientific_name)
    AND lower(s.common_name) = lower(n.common_name)
);
