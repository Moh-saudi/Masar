-- Account administration support.

create index if not exists audit_logs_target_user_id_idx
on public.audit_logs ((metadata ->> 'target_user_id'))
where metadata ? 'target_user_id';

-- Ensure inactive accounts cannot mutate protected operational data.
-- Existing submission RLS already checks profiles.active = true.
