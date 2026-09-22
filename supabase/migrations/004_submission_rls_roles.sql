-- Role based access for daily submissions
-- Ensure geography columns exist before policies reference them. This keeps
-- fresh migration chains executable even before the later hardening migration.

alter table public.profiles
  add column if not exists governorate_id text,
  add column if not exists district_id text;

drop policy if exists "district users access own district" on public.daily_submissions;

create policy "district users access own district"
on public.daily_submissions
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
    and (
      p.role in ('super_admin','central_admin','sector_head','general_director')
      or (
        p.role = 'district_user'
        and p.district_id = daily_submissions.district_id
      )
      or (
        p.role = 'directorate_user'
        and p.governorate_id = daily_submissions.governorate_id
      )
    )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
    and p.role in ('super_admin','central_admin','sector_head','general_director','directorate_user','district_user')
  )
);
