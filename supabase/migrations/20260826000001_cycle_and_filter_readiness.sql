-- Add the inputs required to assess nitrogen-cycle and biological-filter
-- readiness without treating pump turnover as biological capacity.

ALTER TABLE public.filters
  ADD COLUMN IF NOT EXISTS filter_type text,
  ADD COLUMN IF NOT EXISTS biological_media_level text;

UPDATE public.filters
SET
  filter_type = CASE
    WHEN lower(name) LIKE '%sponge%' THEN 'sponge'
    WHEN lower(name) LIKE '%hob%' OR lower(name) LIKE '%aquaclear%' THEN 'hang_on_back'
    WHEN lower(name) LIKE '%canister%' OR lower(name) LIKE '%eheim%' OR lower(name) LIKE '%fluval%' THEN 'canister'
    WHEN lower(name) LIKE '%internal%' THEN 'internal'
    ELSE 'other'
  END,
  biological_media_level = CASE
    WHEN lower(name) LIKE '%canister%' OR lower(name) LIKE '%eheim%' OR lower(name) LIKE '%fluval%' THEN 'substantial'
    WHEN lower(name) LIKE '%internal%' THEN 'minimal'
    ELSE 'standard'
  END
WHERE filter_type IS NULL OR biological_media_level IS NULL;

ALTER TABLE public.filters
  ALTER COLUMN filter_type SET DEFAULT 'other',
  ALTER COLUMN filter_type SET NOT NULL,
  ALTER COLUMN biological_media_level SET DEFAULT 'standard',
  ALTER COLUMN biological_media_level SET NOT NULL;

ALTER TABLE public.filters
  ADD CONSTRAINT filters_filter_type_check
    CHECK (filter_type IN ('sponge', 'hang_on_back', 'internal', 'canister', 'sump', 'undergravel', 'other')),
  ADD CONSTRAINT filters_biological_media_level_check
    CHECK (biological_media_level IN ('minimal', 'standard', 'substantial'));

ALTER TABLE public.tanks
  ADD COLUMN IF NOT EXISTS biological_media_level text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS filter_maturity text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS cycle_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS cycle_method text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS tank_age_weeks numeric,
  ADD COLUMN IF NOT EXISTS ammonia_mg_l numeric,
  ADD COLUMN IF NOT EXISTS nitrite_mg_l numeric,
  ADD COLUMN IF NOT EXISTS nitrate_mg_l numeric,
  ADD COLUMN IF NOT EXISTS water_tested_on date,
  ADD COLUMN IF NOT EXISTS seeded_media boolean NOT NULL DEFAULT false;

ALTER TABLE public.tanks
  ADD CONSTRAINT tanks_biological_media_level_check
    CHECK (biological_media_level IN ('minimal', 'standard', 'substantial')),
  ADD CONSTRAINT tanks_filter_maturity_check
    CHECK (filter_maturity IN ('new', 'maturing', 'established', 'unknown')),
  ADD CONSTRAINT tanks_cycle_status_check
    CHECK (cycle_status IN ('not_started', 'cycling', 'verified', 'unknown')),
  ADD CONSTRAINT tanks_cycle_method_check
    CHECK (cycle_method IN ('fishless', 'fish_in', 'unknown')),
  ADD CONSTRAINT tanks_age_nonnegative_check
    CHECK (tank_age_weeks IS NULL OR tank_age_weeks >= 0),
  ADD CONSTRAINT tanks_ammonia_nonnegative_check
    CHECK (ammonia_mg_l IS NULL OR ammonia_mg_l >= 0),
  ADD CONSTRAINT tanks_nitrite_nonnegative_check
    CHECK (nitrite_mg_l IS NULL OR nitrite_mg_l >= 0),
  ADD CONSTRAINT tanks_nitrate_nonnegative_check
    CHECK (nitrate_mg_l IS NULL OR nitrate_mg_l >= 0);

-- Keep the read-only shared payload sanitised while including the new welfare
-- inputs. Owner and session identifiers remain excluded.
CREATE OR REPLACE FUNCTION public.get_shared_tank(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tank public.tanks%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT * INTO v_tank FROM public.tanks WHERE share_slug = p_slug LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'tank', jsonb_build_object(
      'id', v_tank.id,
      'share_slug', v_tank.share_slug,
      'name', v_tank.name,
      'length_cm', v_tank.length_cm,
      'width_cm', v_tank.width_cm,
      'height_cm', v_tank.height_cm,
      'filter_id', v_tank.filter_id,
      'maintenance_frequency', v_tank.maintenance_frequency,
      'biological_media_level', v_tank.biological_media_level,
      'filter_maturity', v_tank.filter_maturity,
      'cycle_status', v_tank.cycle_status,
      'cycle_method', v_tank.cycle_method,
      'tank_age_weeks', v_tank.tank_age_weeks,
      'ammonia_mg_l', v_tank.ammonia_mg_l,
      'nitrite_mg_l', v_tank.nitrite_mg_l,
      'nitrate_mg_l', v_tank.nitrate_mg_l,
      'water_tested_on', v_tank.water_tested_on,
      'seeded_media', v_tank.seeded_media,
      'target_ph', v_tank.target_ph,
      'target_temp_c', v_tank.target_temp_c,
      'plant_density', v_tank.plant_density,
      'created_at', v_tank.created_at
    ),
    'filter', (SELECT to_jsonb(f) FROM public.filters f WHERE f.id = v_tank.filter_id),
    'species', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('quantity', ts.quantity, 'species', to_jsonb(s)))
      FROM public.tank_species ts JOIN public.species s ON s.id = ts.species_id
      WHERE ts.tank_id = v_tank.id
    ), '[]'::jsonb),
    'plants', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('quantity', tp.quantity, 'plant', to_jsonb(p)))
      FROM public.tank_plants tp JOIN public.plants p ON p.id = tp.plant_id
      WHERE tp.tank_id = v_tank.id
    ), '[]'::jsonb),
    'hardscape', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('quantity', th.quantity, 'hardscape', to_jsonb(h)))
      FROM public.tank_hardscape th JOIN public.hardscape h ON h.id = th.hardscape_id
      WHERE th.tank_id = v_tank.id
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_shared_tank(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_tank(text) TO anon, authenticated;

-- Preserve atomic saves for callers that use the RPC.
CREATE OR REPLACE FUNCTION public.save_tank_atomic(
  p_existing_id uuid,
  p_tank jsonb,
  p_species jsonb,
  p_plants jsonb,
  p_hardscape jsonb
)
RETURNS public.tanks
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tank public.tanks%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_existing_id IS NULL THEN
    INSERT INTO public.tanks (
      user_id, name, length_cm, width_cm, height_cm, filter_id,
      maintenance_frequency, biological_media_level, filter_maturity,
      cycle_status, cycle_method, tank_age_weeks,
      ammonia_mg_l, nitrite_mg_l, nitrate_mg_l,
      water_tested_on, seeded_media, target_ph, target_temp_c, plant_density
    )
    VALUES (
      auth.uid(),
      COALESCE(NULLIF(p_tank->>'name', ''), 'Untitled tank'),
      (p_tank->>'length_cm')::numeric,
      (p_tank->>'width_cm')::numeric,
      (p_tank->>'height_cm')::numeric,
      NULLIF(p_tank->>'filter_id', '')::uuid,
      COALESCE(p_tank->>'maintenance_frequency', 'weekly'),
      COALESCE(p_tank->>'biological_media_level', 'standard'),
      COALESCE(p_tank->>'filter_maturity', 'unknown'),
      COALESCE(p_tank->>'cycle_status', 'unknown'),
      COALESCE(p_tank->>'cycle_method', 'unknown'),
      NULLIF(p_tank->>'tank_age_weeks', '')::numeric,
      NULLIF(p_tank->>'ammonia_mg_l', '')::numeric,
      NULLIF(p_tank->>'nitrite_mg_l', '')::numeric,
      NULLIF(p_tank->>'nitrate_mg_l', '')::numeric,
      NULLIF(p_tank->>'water_tested_on', '')::date,
      COALESCE((p_tank->>'seeded_media')::boolean, false),
      (p_tank->>'target_ph')::numeric,
      (p_tank->>'target_temp_c')::numeric,
      COALESCE(p_tank->>'plant_density', 'light')
    )
    RETURNING * INTO v_tank;
  ELSE
    UPDATE public.tanks
    SET
      name = COALESCE(NULLIF(p_tank->>'name', ''), 'Untitled tank'),
      length_cm = (p_tank->>'length_cm')::numeric,
      width_cm = (p_tank->>'width_cm')::numeric,
      height_cm = (p_tank->>'height_cm')::numeric,
      filter_id = NULLIF(p_tank->>'filter_id', '')::uuid,
      maintenance_frequency = COALESCE(p_tank->>'maintenance_frequency', 'weekly'),
      biological_media_level = COALESCE(p_tank->>'biological_media_level', 'standard'),
      filter_maturity = COALESCE(p_tank->>'filter_maturity', 'unknown'),
      cycle_status = COALESCE(p_tank->>'cycle_status', 'unknown'),
      cycle_method = COALESCE(p_tank->>'cycle_method', 'unknown'),
      tank_age_weeks = NULLIF(p_tank->>'tank_age_weeks', '')::numeric,
      ammonia_mg_l = NULLIF(p_tank->>'ammonia_mg_l', '')::numeric,
      nitrite_mg_l = NULLIF(p_tank->>'nitrite_mg_l', '')::numeric,
      nitrate_mg_l = NULLIF(p_tank->>'nitrate_mg_l', '')::numeric,
      water_tested_on = NULLIF(p_tank->>'water_tested_on', '')::date,
      seeded_media = COALESCE((p_tank->>'seeded_media')::boolean, false),
      target_ph = (p_tank->>'target_ph')::numeric,
      target_temp_c = (p_tank->>'target_temp_c')::numeric,
      plant_density = COALESCE(p_tank->>'plant_density', 'light')
    WHERE id = p_existing_id
      AND user_id = auth.uid()
    RETURNING * INTO v_tank;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Tank not found or not owned by current user';
    END IF;

    DELETE FROM public.tank_species WHERE tank_id = v_tank.id;
    DELETE FROM public.tank_plants WHERE tank_id = v_tank.id;
    DELETE FROM public.tank_hardscape WHERE tank_id = v_tank.id;
  END IF;

  INSERT INTO public.tank_species (tank_id, species_id, quantity)
  SELECT v_tank.id, rows.species_id, rows.quantity
  FROM jsonb_to_recordset(COALESCE(p_species, '[]'::jsonb))
    AS rows(species_id uuid, quantity integer);

  INSERT INTO public.tank_plants (tank_id, plant_id, quantity)
  SELECT v_tank.id, rows.plant_id, rows.quantity
  FROM jsonb_to_recordset(COALESCE(p_plants, '[]'::jsonb))
    AS rows(plant_id uuid, quantity integer);

  INSERT INTO public.tank_hardscape (tank_id, hardscape_id, quantity)
  SELECT v_tank.id, rows.hardscape_id, rows.quantity
  FROM jsonb_to_recordset(COALESCE(p_hardscape, '[]'::jsonb))
    AS rows(hardscape_id uuid, quantity integer);

  RETURN v_tank;
END;
$$;

REVOKE ALL ON FUNCTION public.save_tank_atomic(uuid, jsonb, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_tank_atomic(uuid, jsonb, jsonb, jsonb, jsonb) TO authenticated;
