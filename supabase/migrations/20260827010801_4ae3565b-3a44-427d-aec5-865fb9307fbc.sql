ALTER TABLE public.tanks
  ADD COLUMN IF NOT EXISTS cycle_status text,
  ADD COLUMN IF NOT EXISTS cycle_method text,
  ADD COLUMN IF NOT EXISTS filter_maturity text,
  ADD COLUMN IF NOT EXISTS seeded_media boolean,
  ADD COLUMN IF NOT EXISTS biological_media_level text,
  ADD COLUMN IF NOT EXISTS tank_age_weeks integer,
  ADD COLUMN IF NOT EXISTS water_tested_on date,
  ADD COLUMN IF NOT EXISTS ammonia_mg_l numeric,
  ADD COLUMN IF NOT EXISTS nitrite_mg_l numeric,
  ADD COLUMN IF NOT EXISTS nitrate_mg_l numeric;