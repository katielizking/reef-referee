
ALTER TABLE public.tanks ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

DROP POLICY IF EXISTS "tanks writable by everyone" ON public.tanks;
DROP POLICY IF EXISTS "tanks updatable by everyone" ON public.tanks;
DROP POLICY IF EXISTS "tanks deletable by everyone" ON public.tanks;

CREATE POLICY "tanks insert own" ON public.tanks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tanks update own" ON public.tanks
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "tanks delete own" ON public.tanks
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- tank_species
DROP POLICY IF EXISTS "tank_species write all" ON public.tank_species;
DROP POLICY IF EXISTS "tank_species update all" ON public.tank_species;
DROP POLICY IF EXISTS "tank_species delete all" ON public.tank_species;

CREATE POLICY "tank_species insert own" ON public.tank_species
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid()));
CREATE POLICY "tank_species update own" ON public.tank_species
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid()));
CREATE POLICY "tank_species delete own" ON public.tank_species
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid()));

-- tank_plants
DROP POLICY IF EXISTS "tank_plants write all" ON public.tank_plants;
DROP POLICY IF EXISTS "tank_plants update all" ON public.tank_plants;
DROP POLICY IF EXISTS "tank_plants delete all" ON public.tank_plants;

CREATE POLICY "tank_plants insert own" ON public.tank_plants
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid()));
CREATE POLICY "tank_plants update own" ON public.tank_plants
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid()));
CREATE POLICY "tank_plants delete own" ON public.tank_plants
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid()));

-- tank_hardscape
DROP POLICY IF EXISTS "tank_hardscape write all" ON public.tank_hardscape;
DROP POLICY IF EXISTS "tank_hardscape update all" ON public.tank_hardscape;
DROP POLICY IF EXISTS "tank_hardscape delete all" ON public.tank_hardscape;

CREATE POLICY "tank_hardscape insert own" ON public.tank_hardscape
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid()));
CREATE POLICY "tank_hardscape update own" ON public.tank_hardscape
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid()));
CREATE POLICY "tank_hardscape delete own" ON public.tank_hardscape
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_id AND t.user_id = auth.uid()));
