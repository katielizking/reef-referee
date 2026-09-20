ALTER TABLE public.aquarium_shops
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS ownership text NOT NULL DEFAULT 'independent',
  ADD COLUMN IF NOT EXISTS independent_note text,
  ADD COLUMN IF NOT EXISTS sells_online boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ships_live_fish boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ships_to_countries text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ships_to_regions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shipping_note text,
  ADD COLUMN IF NOT EXISTS delivery_reviewed_on date,
  ADD COLUMN IF NOT EXISTS search_url_template text;

UPDATE public.aquarium_shops SET city = suburb WHERE city IS NULL AND suburb IS NOT NULL;
UPDATE public.aquarium_shops SET region = state WHERE region IS NULL AND state IS NOT NULL;

CREATE INDEX IF NOT EXISTS aquarium_shops_country_idx ON public.aquarium_shops (country_code, region);

CREATE OR REPLACE FUNCTION public.record_shop_outbound(p_shop_id uuid, p_destination text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_destination NOT IN ('website', 'map', 'claim', 'search') THEN
    RAISE EXCEPTION 'Unsupported destination';
  END IF;
  INSERT INTO public.shop_outbound_events(shop_id, destination)
  VALUES (p_shop_id, p_destination);
END;
$function$;