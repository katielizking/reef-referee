-- Plan → save → track water → review changes.
-- A tracked tank can now point at the saved plan it came from, so the tracker
-- keeps the plan's identity (name, size, fish and water targets). Each plan is
-- tracked at most once; deleting the plan keeps the water history.

ALTER TABLE public.tracked_tanks
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.tanks(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tracked_tanks_plan_id_unique
  ON public.tracked_tanks (plan_id)
  WHERE plan_id IS NOT NULL;
