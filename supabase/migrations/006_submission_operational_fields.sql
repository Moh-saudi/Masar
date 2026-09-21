-- Complete operational fields and make daily upserts deterministic.

alter table public.daily_submissions
  add column if not exists override_reason text,
  add column if not exists override_expires_at timestamptz,
  add column if not exists override_granted_by text,
  add column if not exists override_granted_at timestamptz,
  add column if not exists returned_reason text,
  add column if not exists returned_by text,
  add column if not exists returned_at timestamptz;

create unique index if not exists daily_submissions_date_district_uidx
on public.daily_submissions(submission_date, district_id);

create index if not exists daily_submissions_governorate_idx
on public.daily_submissions(governorate_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists daily_submissions_set_updated_at on public.daily_submissions;
create trigger daily_submissions_set_updated_at
before update on public.daily_submissions
for each row execute function public.set_updated_at();
