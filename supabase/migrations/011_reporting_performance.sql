-- Optimize historical reporting without loading every raw submission into the browser.
-- SECURITY INVOKER keeps all existing RLS scope rules in force.

create index if not exists daily_submissions_date_updated_idx
  on public.daily_submissions (submission_date desc, updated_at desc);

create index if not exists daily_submissions_governorate_date_idx
  on public.daily_submissions (governorate_name_ar, submission_date desc);

create index if not exists daily_submissions_district_date_idx
  on public.daily_submissions (district_name_ar, submission_date desc);

create index if not exists daily_submissions_status_date_idx
  on public.daily_submissions (status, submission_date desc);

create or replace function public.report_period_bundle(
  p_from date,
  p_to date,
  p_page integer default 1,
  p_page_size integer default 50,
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
    (
      select jsonb_agg(to_jsonb(p) order by p.submission_date desc, p.updated_at desc)
      from paged p
    ),
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

revoke all on function public.report_period_bundle(date, date, integer, integer, text, text, text) from public;
grant execute on function public.report_period_bundle(date, date, integer, integer, text, text, text) to authenticated;
