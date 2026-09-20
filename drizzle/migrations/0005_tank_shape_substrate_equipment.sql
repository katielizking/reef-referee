ALTER TABLE public.tanks
  ADD COLUMN IF NOT EXISTS tank_shape text NOT NULL DEFAULT 'rectangle',
  ADD COLUMN IF NOT EXISTS substrate text NOT NULL DEFAULT 'gravel',
  ADD COLUMN IF NOT EXISTS has_heater boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_light boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_co2 boolean NOT NULL DEFAULT false;

ALTER TABLE public.tanks
  ADD CONSTRAINT tanks_tank_shape_check
  CHECK (tank_shape IN ('rectangle', 'cube', 'bowfront', 'corner', 'column')) NOT VALID;

ALTER TABLE public.tanks
  ADD CONSTRAINT tanks_substrate_check
  CHECK (substrate IN ('bare', 'sand', 'fine_gravel', 'gravel', 'planted_soil')) NOT VALID;