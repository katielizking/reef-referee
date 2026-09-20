-- Save a tank and all of its contents as one transaction.
-- Any failure rolls back the entire operation, preventing partial or empty saves.
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
      user_id,
      name,
      length_cm,
      width_cm,
      height_cm,
      filter_id,
      maintenance_frequency,
      target_ph,
      target_temp_c,
      plant_density
    )
    VALUES (
      auth.uid(),
      COALESCE(NULLIF(p_tank->>'name', ''), 'Untitled tank'),
      (p_tank->>'length_cm')::numeric,
      (p_tank->>'width_cm')::numeric,
      (p_tank->>'height_cm')::numeric,
      NULLIF(p_tank->>'filter_id', '')::uuid,
      p_tank->>'maintenance_frequency',
      (p_tank->>'target_ph')::numeric,
      (p_tank->>'target_temp_c')::numeric,
      p_tank->>'plant_density'
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
      maintenance_frequency = p_tank->>'maintenance_frequency',
      target_ph = (p_tank->>'target_ph')::numeric,
      target_temp_c = (p_tank->>'target_temp_c')::numeric,
      plant_density = p_tank->>'plant_density'
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
