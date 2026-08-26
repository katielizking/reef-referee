-- Remove permissive public SELECT policies that exposed all users' tank contents
drop policy if exists "tank_species read all" on public.tank_species;
drop policy if exists "tank_plants read all" on public.tank_plants;
drop policy if exists "tank_hardscape read all" on public.tank_hardscape;

-- get_shared_tank is a SECURITY DEFINER function; it must not be callable from the Data API.
revoke execute on function public.get_shared_tank(text) from anon, authenticated, public;
grant execute on function public.get_shared_tank(text) to service_role;