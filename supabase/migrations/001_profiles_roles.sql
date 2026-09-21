create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text,
 role text not null default 'district_user',
 active boolean not null default true,
 governorate text,
 created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "admins manage profiles"
on public.profiles
for all
using (
 exists (
  select 1 from public.profiles p
  where p.id = auth.uid()
  and p.role = 'super_admin'
 )
);
