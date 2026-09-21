create table if not exists public.daily_submissions (
 id uuid primary key default gen_random_uuid(),
 submission_date date not null,
 district_id text not null,
 district_name_ar text not null,
 governorate_id text,
 governorate_name_ar text,
 status text default 'DRAFT',
 directorate_status text default 'PENDING',
 ministry_status text default 'PENDING',
 override_active boolean default false,
 sections jsonb default '{}'::jsonb,
 history_logs jsonb default '{}'::jsonb,
 created_by uuid references auth.users(id),
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);

create index if not exists daily_submissions_date_idx
on public.daily_submissions(submission_date);

create index if not exists daily_submissions_district_idx
on public.daily_submissions(district_id);

alter table public.daily_submissions enable row level security;

create policy "authenticated users can read submissions"
on public.daily_submissions
for select
using (auth.uid() is not null);

create policy "authenticated users can update submissions"
on public.daily_submissions
for update
using (auth.uid() is not null);
