-- Fail-closed geographic access hardening.
-- Rebuild daily_submissions policies from scratch and scope reports by immutable IDs.

alter table public.daily_submissions enable row level security;

drop policy if exists "authenticated users can read submissions" on public.daily_submissions;
drop policy if exists "authenticated users can update submissions" on public.daily_submissions;
drop policy if exists "district users access own district" on public.daily_submissions;
drop policy if exists "submissions_select_by_scope" on public.daily_submissions;
drop policy if exists "submissions_update_by_scope" on public.daily_submissions;
drop policy if exists "submissions_insert_by_scope" on public.daily_submissions;

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
        or (
          p.role = 'directorate_user'
          and p.governorate_id is not null
          and p.governorate_id = daily_submissions.governorate_id
        )
        or (
          p.role = 'district_user'
          and p.district_id is not null
          and p.district_id = daily_submissions.district_id
        )
      )
  )
);

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
        or (
          p.role = 'directorate_user'
          and p.governorate_id is not null
          and p.governorate_id = daily_submissions.governorate_id
        )
        or (
          p.role = 'district_user'
          and p.district_id is not null
          and p.district_id = daily_submissions.district_id
        )
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
        or (
          p.role = 'directorate_user'
          and p.governorate_id is not null
          and p.governorate_id = daily_submissions.governorate_id
        )
        or (
          p.role = 'district_user'
          and p.district_id is not null
          and p.district_id = daily_submissions.district_id
        )
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
        or (
          p.role = 'directorate_user'
          and p.governorate_id is not null
          and p.governorate_id = daily_submissions.governorate_id
        )
        or (
          p.role = 'district_user'
          and p.district_id is not null
          and p.district_id = daily_submissions.district_id
        )
      )
  )
);

drop function if exists public.report_period_bundle(date, date, integer, integer, text, text, text);

create or replace function public.report_period_bundle(
  p_from date,
  p_to date,
  p_page integer default 1,
  p_page_size integer default 50,
  p_governorate_id text default null,
  p_district_id text default null,
  p_governorate_name text default null,
  p_district_name text default null,
  p_status text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with normalized as (
  select
    greatest(coalesce(p_page, 1), 1) as page_no,
    least(greatest(coalesce(p_page_size, 50), 1), 200) as page_size
),
filtered as (
  select
    id,
    submission_date,
    district_id,
    district_name_ar,
    governorate_id,
    governorate_name_ar,
    status,
    directorate_status,
    ministry_status,
    override_active,
    override_reason,
    override_expires_at,
    override_granted_by,
    override_granted_at,
    returned_reason,
    returned_by,
    returned_at,
    sections,
    created_at,
    updated_at
  from public.daily_submissions
  where submission_date between p_from and p_to
    and (p_governorate_id is null or governorate_id = p_governorate_id)
    and (p_district_id is null or district_id = p_district_id)
    and (p_governorate_name is null or governorate_name_ar = p_governorate_name)
    and (p_district_name is null or district_name_ar = p_district_name)
    and (p_status is null or status = p_status)
),
paged as (
  select f.*
  from filtered f, normalized n
  order by f.submission_date desc, f.updated_at desc
  offset ((n.page_no - 1) * n.page_size)
  limit (select page_size from normalized)
),
codes as (
  select generate_series(1, 12) as code
),
expanded as (
  select
    f.submission_date,
    c.code,
    coalesce(nullif(f.sections -> c.code::text ->> 'field_1_value', '')::numeric, 0) as field1,
    coalesce(nullif(f.sections -> c.code::text ->> 'field_2_value', '')::numeric, 0) as field2,
    coalesce(nullif(f.sections -> c.code::text ->> 'field_3_value', '')::numeric, 0) as field3,
    (
      coalesce(f.sections -> c.code::text ->> 'status', 'empty') <> 'empty'
      or coalesce(nullif(f.sections -> c.code::text ->> 'field_1_value', '')::numeric, 0) <> 0
      or coalesce(nullif(f.sections -> c.code::text ->> 'field_2_value', '')::numeric, 0) <> 0
      or coalesce(nullif(f.sections -> c.code::text ->> 'field_3_value', '')::numeric, 0) <> 0
    ) as has_data
  from filtered f
  cross join codes c
),
daily as (
  select
    submission_date as date,
    code,
    sum(field1)::bigint as field1,
    sum(field2)::bigint as field2,
    sum(field3)::bigint as field3,
    bool_or(has_data) as has_data
  from expanded
  group by submission_date, code
),
summary as (
  select
    code,
    sum(field1)::bigint as total1,
    sum(field2)::bigint as total2,
    sum(field3)::bigint as total3,
    count(*) filter (where has_data)::integer as days_with_data
  from daily
  group by code
)
select jsonb_build_object(
  'count', (select count(*) from filtered),
  'rows', coalesce(
    (select jsonb_agg(to_jsonb(p) order by p.submission_date desc, p.updated_at desc) from paged p),
    '[]'::jsonb
  ),
  'summary', coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'code', s.code,
          'total1', s.total1,
          'total2', s.total2,
          'total3', s.total3,
          'days_with_data', s.days_with_data
        )
        order by s.code
      )
      from summary s
    ),
    '[]'::jsonb
  ),
  'daily', coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'date', d.date,
          'code', d.code,
          'field1', d.field1,
          'field2', d.field2,
          'field3', d.field3,
          'has_data', d.has_data
        )
        order by d.date, d.code
      )
      from daily d
    ),
    '[]'::jsonb
  )
);
$$;

revoke all on function public.report_period_bundle(date, date, integer, integer, text, text, text, text, text) from public;
grant execute on function public.report_period_bundle(date, date, integer, integer, text, text, text, text, text) to authenticated;
