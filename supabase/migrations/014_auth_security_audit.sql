-- Migration 014: Indexing and support for authentication audit logs
-- Tracks LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, ACCOUNT_SUSPENDED, ACCOUNT_ACTIVATED

create index if not exists audit_logs_action_created_at_idx
on public.audit_logs (action, created_at desc);

create index if not exists audit_logs_action_user_idx
on public.audit_logs (action, user_id);

comment on table public.audit_logs is 'Immutable audit log tracking system actions including security and authentication events.';
