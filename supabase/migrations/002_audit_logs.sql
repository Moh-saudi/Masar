create table if not exists public.audit_logs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete set null,
 action text not null,
 entity text,
 entity_id text,
 metadata jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

create policy "admins can read audit logs"
on public.audit_logs
for select
using (
 exists (
  select 1 from public.profiles p
  where p.id = auth.uid()
  and p.role in ('super_admin','central_admin')
 )
);
