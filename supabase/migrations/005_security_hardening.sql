-- Security hardening for profiles, submissions and audit logs

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists national_id text,
  add column if not exists role_title_ar text,
  add column if not exists governorate_id text,
  add column if not exists governorate_name_ar text,
  add column if not exists district_id text,
  add column if not exists district_name_ar text;

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_governorate_idx on public.profiles(governorate_id);
create index if not exists profiles_district_idx on public.profiles(district_id);

-- Remove permissive policies that would otherwise bypass geographic RBAC.
drop policy if exists "authenticated users can read submissions" on public.daily_submissions;
drop policy if exists "authenticated users can update submissions" on public.daily_submissions;
drop policy if exists "district users access own district" on public.daily_submissions;

-- Read access is scoped by role and geography.
create policy "submissions_select_by_scope"
on public.daily_submissions
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and (
        p.role in ('super_admin','central_admin','sector_head','general_director')
        or (p.role = 'directorate_user' and p.governorate_id = daily_submissions.governorate_id)
        or (p.role = 'district_user' and p.district_id = daily_submissions.district_id)
      )
  )
);

-- District users can edit their own district. Directorate and central roles
-- can update rows inside their permitted scope.
create policy "submissions_update_by_scope"
on public.daily_submissions
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and (
        p.role in ('super_admin','central_admin','general_director')
        or (p.role = 'directorate_user' and p.governorate_id = daily_submissions.governorate_id)
        or (p.role = 'district_user' and p.district_id = daily_submissions.district_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and (
        p.role in ('super_admin','central_admin','general_director')
        or (p.role = 'directorate_user' and p.governorate_id = daily_submissions.governorate_id)
        or (p.role = 'district_user' and p.district_id = daily_submissions.district_id)
      )
  )
);

create policy "submissions_insert_by_scope"
on public.daily_submissions
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and (
        p.role in ('super_admin','central_admin','general_director')
        or (p.role = 'directorate_user' and p.governorate_id = daily_submissions.governorate_id)
        or (p.role = 'district_user' and p.district_id = daily_submissions.district_id)
      )
  )
);

-- Users may append their own audit events; audit reading stays restricted.
drop policy if exists "users insert own audit logs" on public.audit_logs;
create policy "users insert own audit logs"
on public.audit_logs
for insert
with check (auth.uid() = user_id);
