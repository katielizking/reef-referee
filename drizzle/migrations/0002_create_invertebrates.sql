CREATE TABLE public.invertebrates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name text NOT NULL,
  scientific_name text NOT NULL,
  invert_group text NOT NULL DEFAULT 'shrimp',
  min_tank_litres numeric NOT NULL,
  adult_size_cm numeric NOT NULL,
  bioload_factor numeric NOT NULL,
  temperament text NOT NULL DEFAULT 'peaceful',
  min_group_size integer NOT NULL DEFAULT 1,
  predatory boolean NOT NULL DEFAULT false,
  fish_risk_note text,
  native_ph_min numeric NOT NULL,
  native_ph_max numeric NOT NULL,
  native_temp_min_c numeric NOT NULL,
  native_temp_max_c numeric NOT NULL,
  biotope_region text NOT NULL DEFAULT 'unmapped',
  algae_role text,
  care_notes text,
  care_source_label text,
  care_source_url text,
  care_reviewed_on date,
  care_confidence text NOT NULL DEFAULT 'unreviewed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX invertebrates_scientific_name_key ON public.invertebrates (lower(scientific_name));

GRANT SELECT ON public.invertebrates TO anon;
GRANT SELECT ON public.invertebrates TO authenticated;
GRANT ALL ON public.invertebrates TO service_role;

ALTER TABLE public.invertebrates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invertebrates readable by everyone"
  ON public.invertebrates FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE public.tank_invertebrates (
  tank_id uuid NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE,
  invertebrate_id uuid NOT NULL REFERENCES public.invertebrates(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  PRIMARY KEY (tank_id, invertebrate_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tank_invertebrates TO authenticated;
GRANT ALL ON public.tank_invertebrates TO service_role;

ALTER TABLE public.tank_invertebrates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tank_invertebrates select own"
  ON public.tank_invertebrates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_invertebrates.tank_id AND t.user_id = auth.uid()));

CREATE POLICY "tank_invertebrates insert own"
  ON public.tank_invertebrates FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_invertebrates.tank_id AND t.user_id = auth.uid()));

CREATE POLICY "tank_invertebrates update own"
  ON public.tank_invertebrates FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_invertebrates.tank_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_invertebrates.tank_id AND t.user_id = auth.uid()));

CREATE POLICY "tank_invertebrates delete own"
  ON public.tank_invertebrates FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tanks t WHERE t.id = tank_invertebrates.tank_id AND t.user_id = auth.uid()));
