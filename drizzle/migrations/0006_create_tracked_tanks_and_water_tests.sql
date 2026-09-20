CREATE TABLE public.tracked_tanks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  litres numeric,
  tank_age_weeks integer,
  cycle_status text NOT NULL DEFAULT 'unknown',
  cycle_method text NOT NULL DEFAULT 'unknown',
  filter_maturity text NOT NULL DEFAULT 'unknown',
  biological_media_level text NOT NULL DEFAULT 'standard',
  seeded_media boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tracked_tanks_cycle_status_check CHECK (cycle_status IN ('unknown','not_started','cycling','verified')),
  CONSTRAINT tracked_tanks_cycle_method_check CHECK (cycle_method IN ('unknown','fishless','seeded','plant_only','fish_in')),
  CONSTRAINT tracked_tanks_filter_maturity_check CHECK (filter_maturity IN ('unknown','new','maturing','established')),
  CONSTRAINT tracked_tanks_media_level_check CHECK (biological_media_level IN ('minimal','standard','generous'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracked_tanks TO authenticated;
GRANT ALL ON public.tracked_tanks TO service_role;

ALTER TABLE public.tracked_tanks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their tracked tanks" ON public.tracked_tanks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners create their tracked tanks" ON public.tracked_tanks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update their tracked tanks" ON public.tracked_tanks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete their tracked tanks" ON public.tracked_tanks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.water_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id uuid NOT NULL REFERENCES public.tracked_tanks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tested_on date NOT NULL DEFAULT CURRENT_DATE,
  ammonia_mg_l numeric,
  nitrite_mg_l numeric,
  nitrate_mg_l numeric,
  ph numeric,
  temp_c numeric,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_tests TO authenticated;
GRANT ALL ON public.water_tests TO service_role;

ALTER TABLE public.water_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their water tests" ON public.water_tests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners create their water tests" ON public.water_tests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update their water tests" ON public.water_tests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete their water tests" ON public.water_tests
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX water_tests_tank_tested_idx ON public.water_tests (tank_id, tested_on DESC);
