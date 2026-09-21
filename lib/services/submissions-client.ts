import { createBrowserClient } from '@/lib/supabase/client'
import type { DailySubmission, UserProfile } from '@/lib/types'

function toDatabasePayload(submission: DailySubmission, user?: UserProfile) {
  return {
    submission_date: submission.submission_date,
    district_id: submission.district_id,
    district_name_ar: submission.district_name_ar,
    governorate_id: submission.governorate_id,
    governorate_name_ar: submission.governorate_name_ar,
    status: submission.status,
    directorate_status: submission.directorate_status,
    ministry_status: submission.ministry_status,
    override_active: submission.override_active,
    override_reason: submission.override_reason ?? null,
    override_expires_at: submission.override_expires_at ?? null,
    override_granted_by: submission.override_granted_by ?? null,
    override_granted_at: submission.override_granted_at ?? null,
    returned_reason: submission.returned_reason ?? null,
    returned_by: submission.returned_by ?? null,
    returned_at: submission.returned_at ?? null,
    sections: submission.sections,
    history_logs: submission.history_logs ?? {},
    created_by: user?.id ?? null,
  }
}

export async function fetchDailySubmissions(): Promise<DailySubmission[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('daily_submissions')
    .select('*')
    .order('submission_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as DailySubmission[]
}

export async function persistDailySubmission(
  submission: DailySubmission,
  user?: UserProfile
): Promise<DailySubmission> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('daily_submissions')
    .upsert(toDatabasePayload(submission, user), {
      onConflict: 'submission_date,district_id',
    })
    .select('*')
    .single()

  if (error) throw error
  return data as DailySubmission
}

export async function writeAuditEvent(input: {
  user: UserProfile
  action: string
  entity?: string
  entityId?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = createBrowserClient()

  const { error } = await supabase.from('audit_logs').insert({
    user_id: input.user.id,
    action: input.action,
    entity: input.entity ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  })

  if (error) throw error
}


export async function approveNationalReport(user: UserProfile) {
  const supabase = createBrowserClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('daily_submissions')
    .update({ ministry_status: 'APPROVED' })
    .eq('submission_date', today)
    .select('*')

  if (error) throw error

  await writeAuditEvent({
    user,
    action: 'MINISTRY_NATIONAL_APPROVAL',
    entity: 'daily_submissions',
    metadata: {
      actor_name: user.full_name,
      actor_role: user.role_title_ar,
      description: 'الاعتماد الوزاري القومي الشامل للتقرير اليومي لكافة محافظات الجمهورية',
      submission_date: today,
      approved_count: data?.length ?? 0,
    },
  })

  return (data ?? []) as DailySubmission[]
}
