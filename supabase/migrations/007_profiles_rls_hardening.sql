-- Avoid recursive RLS checks on public.profiles.

create or replace function public.current_user_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active = true
      and role = 'super_admin'
  );
$$;

revoke all on function public.current_user_is_super_admin() from public;
grant execute on function public.current_user_is_super_admin() to authenticated;

drop policy if exists "admins manage profiles" on public.profiles;

create policy "super admin manages profiles"
on public.profiles
for all
using (public.current_user_is_super_admin())
with check (public.current_user_is_super_admin());
