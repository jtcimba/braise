-- Fix circular RLS dependency: the primary user couldn't read their own household
-- because the SELECT policy required being in household_members, but inserting into
-- household_members requires reading households first to verify primary_user_id.
drop policy if exists "Members can read own household" on public.households;
drop policy if exists "Members or primary can read own household" on public.households;

create policy "Members or primary can read own household"
  on public.households for select
  using (id = public.user_household_id() or primary_user_id = auth.uid());
