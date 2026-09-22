import { createBrowserClient } from '@/lib/supabase/client'
import type { DailySubmission, UserProfile } from '@/lib/types'
import { getCairoDateString } from '@/lib/date'

const SUBMISSION_COLUMNS = [
  'id',
  'submission_date',
  'district_id',
  'district_name_ar',
  'governorate_id',
  'governorate_name_ar',
  'status',
  'directorate_status',
  'ministry_status',
  'override_active',
  'override_reason',
  'override_expires_at',
  'override_granted_by',
  'override_granted_at',
  'returned_reason',
  'returned_by',
  'returned_at',
  'sections',
  'history_logs',
  'created_by',
  'created_at',
  'updated_at',
].join(',')

function toDatabasePayload(submission: DailySubmission, user?: UserProfile) {
  const payload: Record<string, unknown> = {
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
  }

  // created_by is written only when we have an actor. Database-side values on
  // existing rows should not be blanked during review/approval updates.
  if (user?.id) payload.created_by = user.id

  return payload
}

export interface SubmissionPageOptions {
  fromDate?: string
  toDate?: string
  page?: number
  pageSize?: number
}

export interface SubmissionPageResult {
  rows: DailySubmission[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export async function fetchSubmissionPage(
  options: SubmissionPageOptions = {}
): Promise<SubmissionPageResult> {
  const supabase = createBrowserClient()
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(200, Math.max(1, options.pageSize ?? 50))
  const fromDate = options.fromDate ?? getCairoDateString()
  const toDate = options.toDate ?? fromDate
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('daily_submissions')
    .select(SUBMISSION_COLUMNS, { count: 'exact' })
    .gte('submission_date', fromDate)
    .lte('submission_date', toDate)
    .order('submission_date', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const total = count ?? 0
  return {
    rows: (data ?? []) as DailySubmission[],
    count: total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function fetchDailySubmissions(date = getCairoDateString()): Promise<DailySubmission[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('daily_submissions')
    .select(SUBMISSION_COLUMNS)
    .eq('submission_date', date)
    .order('updated_at', { ascending: false })

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
    .select(SUBMISSION_COLUMNS)
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
  const today = getCairoDateString()

  const { data, error } = await supabase
    .from('daily_submissions')
    .update({ ministry_status: 'APPROVED' })
    .eq('submission_date', today)
    .select(SUBMISSION_COLUMNS)

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
