-- Sector head needs write access for the final national approval.

drop policy if exists "submissions_update_by_scope" on public.daily_submissions;

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
        p.role in ('super_admin','central_admin','general_director','sector_head')
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
        p.role in ('super_admin','central_admin','general_director','sector_head')
        or (p.role = 'directorate_user' and p.governorate_id = daily_submissions.governorate_id)
        or (p.role = 'district_user' and p.district_id = daily_submissions.district_id)
      )
  )
);
