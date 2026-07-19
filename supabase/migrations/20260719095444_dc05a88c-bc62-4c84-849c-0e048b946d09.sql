
-- 1. Tighten SELECT on tanks and join tables to owners only
DROP POLICY IF EXISTS "tanks readable by everyone" ON public.tanks;
DROP POLICY IF EXISTS "tanks select own" ON public.tanks;
CREATE POLICY "tanks select own" ON public.tanks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- tank_species
DROP POLICY IF EXISTS "tank_species readable by everyone" ON public.tank_species;
DROP POLICY IF EXISTS "tank_species select via tank" ON public.tank_species;
DROP POLICY IF EXISTS "tank_species read" ON public.tank_species;
CREATE POLICY "tank_species select own" ON public.tank_species
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_species.tank_id AND t.user_id = auth.uid()));

-- tank_plants
DROP POLICY IF EXISTS "tank_plants readable by everyone" ON public.tank_plants;
DROP POLICY IF EXISTS "tank_plants select via tank" ON public.tank_plants;
DROP POLICY IF EXISTS "tank_plants read" ON public.tank_plants;
CREATE POLICY "tank_plants select own" ON public.tank_plants
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_plants.tank_id AND t.user_id = auth.uid()));

-- tank_hardscape
DROP POLICY IF EXISTS "tank_hardscape readable by everyone" ON public.tank_hardscape;
DROP POLICY IF EXISTS "tank_hardscape select via tank" ON public.tank_hardscape;
DROP POLICY IF EXISTS "tank_hardscape read" ON public.tank_hardscape;
CREATE POLICY "tank_hardscape select own" ON public.tank_hardscape
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_hardscape.tank_id AND t.user_id = auth.uid()));

-- 2. Security definer function to fetch a shared tank by slug, sanitized
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
