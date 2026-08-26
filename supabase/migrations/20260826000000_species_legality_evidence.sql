-- Add traceable, jurisdiction-aware legality evidence to the species catalogue.
ALTER TABLE public.species
  ADD COLUMN IF NOT EXISTS legal_import_status text NOT NULL DEFAULT 'unknown'
    CHECK (legal_import_status IN ('permitted_with_conditions', 'not_permitted', 'not_applicable_native', 'unknown')),
  ADD COLUMN IF NOT EXISTS legal_possession_status text NOT NULL DEFAULT 'check_state_rules'
    CHECK (legal_possession_status IN ('generally_permitted_check_state', 'check_state_permits', 'prohibited_or_restricted', 'check_state_rules')),
  ADD COLUMN IF NOT EXISTS legal_source_label text,
  ADD COLUMN IF NOT EXISTS legal_source_url text,
  ADD COLUMN IF NOT EXISTS legal_reviewed_on date,
  ADD COLUMN IF NOT EXISTS legal_confidence text NOT NULL DEFAULT 'incomplete'
    CHECK (legal_confidence IN ('verified', 'medium', 'incomplete'));

UPDATE public.species
SET
  legal_import_status = 'permitted_with_conditions',
  legal_possession_status = 'generally_permitted_check_state',
  legal_source_label = 'Australian Government — permitted ornamental fish list',
  legal_source_url = 'https://www.agriculture.gov.au/biosecurity-trade/policy/legislation/list-of-permitted-live-freshwater-and-marine-ornamental-fish',
  legal_reviewed_on = DATE '2026-08-26',
  legal_confidence = 'medium'
WHERE legal_status = 'permitted';

UPDATE public.species
SET
  legal_import_status = 'not_applicable_native',
  legal_possession_status = 'check_state_permits',
  legal_source_label = 'Check the relevant state or territory fisheries authority',
  legal_source_url = NULL,
  legal_reviewed_on = DATE '2026-08-26',
  legal_confidence = 'incomplete'
WHERE legal_status = 'native';

UPDATE public.species
SET
  legal_import_status = 'not_permitted',
  legal_possession_status = 'prohibited_or_restricted',
  legal_source_label = 'Australian Government — Live Import List guidance',
  legal_source_url = 'https://www.agriculture.gov.au/biosecurity-trade/wildlife-trade/live-import-list',
  legal_reviewed_on = DATE '2026-08-26',
  legal_confidence = 'medium'
WHERE legal_status = 'prohibited';

COMMENT ON COLUMN public.species.legal_import_status IS
  'Federal live-import classification; does not by itself determine state possession legality.';
COMMENT ON COLUMN public.species.legal_possession_status IS
  'Plain-language possession guidance. Users must check their state or territory rules.';
COMMENT ON COLUMN public.species.legal_confidence IS
  'Evidence confidence for the current legal classification.';
