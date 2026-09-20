ALTER TABLE public.invertebrates
  ADD COLUMN IF NOT EXISTS needs_land boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS legal_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS legal_note text;

UPDATE public.invertebrates
SET needs_land = true
WHERE scientific_name IN ('Geosesarma dennerle', 'Cardisoma armatum', 'Pseudosesarma moeshi');

UPDATE public.invertebrates
SET legal_status = 'prohibited',
    legal_note = 'Declared prohibited invasive species in Queensland: keeping, moving, giving away or selling is illegal and possession must be reported to Biosecurity Queensland. Also listed as a noxious fish federally. Check your own state rules.'
WHERE scientific_name = 'Procambarus clarkii';

UPDATE public.invertebrates
SET legal_status = 'permit_may_be_required',
    legal_note = 'Native to Australia, but several states require a licence or permit to keep it. Check your state fisheries rules before buying.'
WHERE scientific_name IN ('Cherax destructor', 'Cherax quadricarinatus', 'Cherax cainii');