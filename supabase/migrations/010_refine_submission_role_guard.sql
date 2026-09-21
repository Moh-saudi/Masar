-- Refine role guard with explicit sector-head column checks.

create or replace function public.enforce_submission_role_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
begin
  select role into current_role
  from public.profiles
  where id = auth.uid() and active = true;

  if current_role is null then
    raise exception 'Unauthorized submission change';
  end if;

  if current_role = 'super_admin' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if current_role = 'district_user' then
      if new.status <> 'DRAFT'
         or new.directorate_status <> 'PENDING'
         or new.ministry_status <> 'PENDING'
         or coalesce(new.override_active, false) = true then
        raise exception 'District users can only create draft submissions';
      end if;
    elsif current_role = 'sector_head' then
      raise exception 'Sector head cannot create district submissions';
    end if;

    return new;
  end if;

  if current_role = 'district_user' then
    if new.district_id is distinct from old.district_id
       or new.governorate_id is distinct from old.governorate_id
       or new.submission_date is distinct from old.submission_date
       or new.directorate_status is distinct from old.directorate_status
       or new.ministry_status is distinct from old.ministry_status
       or new.override_active is distinct from old.override_active
       or new.override_expires_at is distinct from old.override_expires_at
       or new.override_granted_by is distinct from old.override_granted_by
       or new.override_granted_at is distinct from old.override_granted_at
       or new.returned_reason is distinct from old.returned_reason
       or new.returned_by is distinct from old.returned_by
       or new.returned_at is distinct from old.returned_at then
      raise exception 'District user attempted to change protected submission fields';
    end if;

    if new.status is distinct from old.status
       and new.status not in ('DRAFT', 'SUBMITTED_LOCKED') then
      raise exception 'District user cannot set this submission status';
    end if;

    return new;
  end if;

  if current_role = 'directorate_user' then
    if new.district_id is distinct from old.district_id
       or new.governorate_id is distinct from old.governorate_id
       or new.submission_date is distinct from old.submission_date
       or new.ministry_status is distinct from old.ministry_status
       or new.sections is distinct from old.sections
       or new.history_logs is distinct from old.history_logs then
      raise exception 'Directorate user attempted to change protected submission fields';
    end if;

    return new;
  end if;

  if current_role in ('general_director', 'central_admin') then
    if new.district_id is distinct from old.district_id
       or new.governorate_id is distinct from old.governorate_id
       or new.submission_date is distinct from old.submission_date
       or new.sections is distinct from old.sections
       or new.history_logs is distinct from old.history_logs then
      raise exception 'Ministry reviewer attempted to change protected submission data';
    end if;

    return new;
  end if;

  if current_role = 'sector_head' then
    if new.district_id is distinct from old.district_id
       or new.district_name_ar is distinct from old.district_name_ar
       or new.governorate_id is distinct from old.governorate_id
       or new.governorate_name_ar is distinct from old.governorate_name_ar
       or new.submission_date is distinct from old.submission_date
       or new.status is distinct from old.status
       or new.directorate_status is distinct from old.directorate_status
       or new.override_active is distinct from old.override_active
       or new.override_reason is distinct from old.override_reason
       or new.override_expires_at is distinct from old.override_expires_at
       or new.override_granted_by is distinct from old.override_granted_by
       or new.override_granted_at is distinct from old.override_granted_at
       or new.returned_reason is distinct from old.returned_reason
       or new.returned_by is distinct from old.returned_by
       or new.returned_at is distinct from old.returned_at
       or new.sections is distinct from old.sections
       or new.history_logs is distinct from old.history_logs
       or new.created_by is distinct from old.created_by then
      raise exception 'Sector head can only change ministry approval status';
    end if;

    return new;
  end if;

  raise exception 'Role is not allowed to change submissions';
end;
$$;
