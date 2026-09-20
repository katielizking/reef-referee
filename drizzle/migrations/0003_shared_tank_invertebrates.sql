CREATE OR REPLACE FUNCTION public.get_shared_tank(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
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
    'filters', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'filter', to_jsonb(f),
        'biological_media_level', tf.biological_media_level,
        'filter_maturity', tf.filter_maturity
      ) ORDER BY tf.position)
      FROM public.tank_filters tf JOIN public.filters f ON f.id = tf.filter_id
      WHERE tf.tank_id = v_tank.id
    ), '[]'::jsonb),
    'species', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('quantity', ts.quantity, 'species', to_jsonb(s)))
      FROM public.tank_species ts JOIN public.species s ON s.id = ts.species_id
      WHERE ts.tank_id = v_tank.id
    ), '[]'::jsonb),
    'invertebrates', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('quantity', ti.quantity, 'invertebrate', to_jsonb(i)))
      FROM public.tank_invertebrates ti JOIN public.invertebrates i ON i.id = ti.invertebrate_id
      WHERE ti.tank_id = v_tank.id
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
$fn$;

REVOKE ALL ON FUNCTION public.get_shared_tank(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_shared_tank(text) FROM anon;
REVOKE ALL ON FUNCTION public.get_shared_tank(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_tank(text) TO service_role;
