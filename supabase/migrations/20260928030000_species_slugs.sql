-- Readable species URLs: /species/neon-tetra instead of /species/<uuid>.
-- Old UUID URLs keep working; the app redirects them to the slug.

CREATE OR REPLACE FUNCTION public.species_slugify(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT btrim(regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'), '-')
$$;

ALTER TABLE public.species ADD COLUMN IF NOT EXISTS slug text;

-- Common name first. A clash takes the scientific name too, and a clash
-- after that takes part of the id, so every slug is unique.
WITH ranked AS (
  SELECT
    id,
    public.species_slugify(common_name) AS base,
    public.species_slugify(scientific_name) AS sci,
    row_number() OVER (PARTITION BY public.species_slugify(common_name) ORDER BY id) AS rn
  FROM public.species
  WHERE slug IS NULL
)
UPDATE public.species s
SET slug = CASE WHEN ranked.rn = 1 THEN ranked.base ELSE ranked.base || '-' || ranked.sci END
FROM ranked
WHERE s.id = ranked.id;

WITH dupes AS (
  SELECT id, row_number() OVER (PARTITION BY slug ORDER BY id) AS rn FROM public.species
)
UPDATE public.species s
SET slug = s.slug || '-' || left(s.id::text, 8)
FROM dupes
WHERE s.id = dupes.id AND dupes.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS species_slug_unique ON public.species (slug);

-- New species get a slug automatically.
CREATE OR REPLACE FUNCTION public.species_set_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
BEGIN
  IF NEW.slug IS NOT NULL AND btrim(NEW.slug) <> '' THEN
    RETURN NEW;
  END IF;
  candidate := public.species_slugify(NEW.common_name);
  IF EXISTS (SELECT 1 FROM public.species WHERE slug = candidate AND id <> NEW.id) THEN
    candidate := candidate || '-' || public.species_slugify(NEW.scientific_name);
  END IF;
  IF EXISTS (SELECT 1 FROM public.species WHERE slug = candidate AND id <> NEW.id) THEN
    candidate := candidate || '-' || left(NEW.id::text, 8);
  END IF;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS species_set_slug ON public.species;
CREATE TRIGGER species_set_slug
  BEFORE INSERT OR UPDATE OF slug ON public.species
  FOR EACH ROW EXECUTE FUNCTION public.species_set_slug();

ALTER TABLE public.species ALTER COLUMN slug SET NOT NULL;
