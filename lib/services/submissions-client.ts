import { createBrowserClient } from '@/lib/supabase/client'
import type { DailySubmission, UserProfile } from '@/lib/types'
import { getCairoDateString } from '@/lib/date'
import { invalidateAuditTrailCache } from './audit-client'

const SUBMISSION_LIST_COLUMNS = [
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
  'created_at',
  'updated_at',
].join(',')

const SUBMISSION_DETAIL_COLUMNS = [
  SUBMISSION_LIST_COLUMNS,
  'history_logs',
  'created_by',
].join(',')

function hydrateListRow(row: any): DailySubmission {
  return {
    ...row,
    history_logs: row.history_logs ?? {},
  } as DailySubmission
}

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

  if (user?.id) payload.created_by = user.id
  return payload
}

export interface SubmissionPageOptions {
  fromDate?: string
  toDate?: string
  page?: number
  pageSize?: number
  governorateId?: string
  districtId?: string
  governorateName?: string
  districtName?: string
  status?: string
}

export interface SubmissionPageResult {
  rows: DailySubmission[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ReportPeriodSummaryRow {
  code: number
  total1: number
  total2: number
  total3: number
  daysWithData: number
}

export interface ReportPeriodDailyRow {
  date: string
  code: number
  field1: number
  field2: number
  field3: number
  hasData: boolean
}

export interface ReportPeriodAnalytics {
  summary: ReportPeriodSummaryRow[]
  daily: ReportPeriodDailyRow[]
  dateCount: number
}

export interface ReportPeriodBundle extends SubmissionPageResult {
  analytics: ReportPeriodAnalytics | null
  analyticsComplete: boolean
}

let reportBundleRpcUnavailable = false

function normalizePageOptions(options: SubmissionPageOptions) {
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(200, Math.max(1, options.pageSize ?? 50))
  const fromDate = options.fromDate ?? getCairoDateString()
  const toDate = options.toDate ?? fromDate

  return { page, pageSize, fromDate, toDate }
}

export async function fetchSubmissionPage(
  options: SubmissionPageOptions = {}
): Promise<SubmissionPageResult> {
  const supabase = createBrowserClient()
  const { page, pageSize, fromDate, toDate } = normalizePageOptions(options)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('daily_submissions')
    .select(SUBMISSION_LIST_COLUMNS, { count: 'exact' })
    .gte('submission_date', fromDate)
    .lte('submission_date', toDate)

  if (options.governorateId) {
    query = query.eq('governorate_id', options.governorateId)
  } else if (options.governorateName) {
    query = query.eq('governorate_name_ar', options.governorateName)
  }

  if (options.districtId) {
    query = query.eq('district_id', options.districtId)
  } else if (options.districtName) {
    query = query.eq('district_name_ar', options.districtName)
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  const { data, error, count } = await query
    .order('submission_date', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const total = count ?? 0
  return {
    rows: (data ?? []).map(hydrateListRow),
    count: total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function fetchReportPeriodBundle(
  options: SubmissionPageOptions = {}
): Promise<ReportPeriodBundle> {
  const normalized = normalizePageOptions(options)

  if (!reportBundleRpcUnavailable) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.rpc('report_period_bundle', {
      p_from: normalized.fromDate,
      p_to: normalized.toDate,
      p_page: normalized.page,
      p_page_size: normalized.pageSize,
      p_governorate_id: options.governorateId ?? null,
      p_district_id: options.districtId ?? null,
      p_governorate_name: options.governorateName ?? null,
      p_district_name: options.districtName ?? null,
      p_status: options.status ?? null,
    })

    if (!error && data) {
      const payload = data as any
      const total = Number(payload.count ?? 0)
      const rows = Array.isArray(payload.rows) ? payload.rows.map(hydrateListRow) : []
      const summary = Array.isArray(payload.summary)
        ? payload.summary.map((row: any) => ({
            code: Number(row.code),
            total1: Number(row.total1 ?? 0),
            total2: Number(row.total2 ?? 0),
            total3: Number(row.total3 ?? 0),
            daysWithData: Number(row.days_with_data ?? row.daysWithData ?? 0),
          }))
        : []
      const daily = Array.isArray(payload.daily)
        ? payload.daily.map((row: any) => ({
            date: String(row.date),
            code: Number(row.code),
            field1: Number(row.field1 ?? 0),
            field2: Number(row.field2 ?? 0),
            field3: Number(row.field3 ?? 0),
            hasData: Boolean(row.has_data ?? row.hasData),
          }))
        : []

      return {
        rows,
        count: total,
        page: normalized.page,
        pageSize: normalized.pageSize,
        totalPages: Math.max(1, Math.ceil(total / normalized.pageSize)),
        analytics: {
          summary,
          daily,
          dateCount: new Set(daily.map((row: ReportPeriodDailyRow) => row.date)).size,
        },
        analyticsComplete: true,
      }
    }

    const functionMissing =
      error?.code === 'PGRST202' ||
      error?.code === '42883' ||
      error?.message?.includes('report_period_bundle')

    if (!functionMissing && error) throw error
    reportBundleRpcUnavailable = true
  }

  const pageResult = await fetchSubmissionPage(options)
  const analyticsComplete = pageResult.count <= pageResult.rows.length

  return {
    ...pageResult,
    analytics: null,
    analyticsComplete,
  }
}

export async function fetchDailySubmissions(
  date = getCairoDateString()
): Promise<DailySubmission[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('daily_submissions')
    .select(SUBMISSION_LIST_COLUMNS)
    .eq('submission_date', date)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(hydrateListRow)
}

export async function fetchSubmissionDetails(id: string): Promise<DailySubmission> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('daily_submissions')
    .select(SUBMISSION_DETAIL_COLUMNS)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as DailySubmission
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
    .select(SUBMISSION_DETAIL_COLUMNS)
    .single()

  if (error) throw error
  return data as DailySubmission
}

export async function grantDirectorateOverride(
  submissionId: string,
  user: UserProfile,
  durationMinutes = 30
): Promise<DailySubmission> {
  const supabase = createBrowserClient()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + durationMinutes * 60_000).toISOString()

  const { data, error } = await supabase
    .from('daily_submissions')
    .update({
      override_active: true,
      override_expires_at: expiresAt,
      override_granted_by: `${user.full_name} (${user.role_title_ar})`,
      override_granted_at: now.toISOString(),
      status: 'DRAFT',
    })
    .eq('id', submissionId)
    .select(SUBMISSION_DETAIL_COLUMNS)
    .single()

  if (error) throw error
  return data as DailySubmission
}

export async function returnDirectorateSubmission(
  submissionId: string,
  reason: string,
  user: UserProfile
): Promise<DailySubmission> {
  const supabase = createBrowserClient()
  const now = new Date()
  const { data, error } = await supabase
    .from('daily_submissions')
    .update({
      status: 'RETURNED',
      directorate_status: 'RETURNED',
      returned_reason: reason,
      returned_by: `${user.full_name} (${user.role_title_ar})`,
      returned_at: now.toISOString(),
      override_active: false,
      override_expires_at: null,
    })
    .eq('id', submissionId)
    .select(SUBMISSION_DETAIL_COLUMNS)
    .single()

  if (error) throw error
  return data as DailySubmission
}

export async function approveDirectorateSubmission(
  submissionId: string
): Promise<DailySubmission> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('daily_submissions')
    .update({
      directorate_status: 'APPROVED',
      status: 'APPROVED',
      override_active: false,
      override_expires_at: null,
    })
    .eq('id', submissionId)
    .select(SUBMISSION_DETAIL_COLUMNS)
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
  invalidateAuditTrailCache()
}

export async function approveNationalReport(user: UserProfile) {
  const supabase = createBrowserClient()
  const today = getCairoDateString()

  const { data, error } = await supabase
    .from('daily_submissions')
    .update({ ministry_status: 'APPROVED' })
    .eq('submission_date', today)
    .select(SUBMISSION_LIST_COLUMNS)

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

  return (data ?? []).map(hydrateListRow)
}
