import { createBrowserClient } from '@/lib/supabase/client'
import type { AuditLog } from '@/lib/types'

const CACHE_TTL_MS = 15_000

let auditCache: {
  limit: number
  timestamp: number
  rows: AuditLog[]
} | null = null

export function invalidateAuditTrailCache() {
  auditCache = null
}

export async function fetchAuditTrail(limit = 100, force = false): Promise<AuditLog[]> {
  const safeLimit = Math.min(250, Math.max(1, limit))

  if (
    !force &&
    auditCache &&
    auditCache.limit >= safeLimit &&
    Date.now() - auditCache.timestamp < CACHE_TTL_MS
  ) {
    return auditCache.rows.slice(0, safeLimit)
  }

  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(safeLimit)

  if (error) throw error

  const rows = (data ?? []).map((row: any) => {
    const metadata = row.metadata ?? {}

    return {
      id: row.id,
      timestamp: metadata.timestamp ?? new Date(row.created_at).toLocaleString('ar-EG'),
      actor_name: metadata.actor_name ?? metadata.user_name ?? 'مستخدم المنظومة',
      actor_role: metadata.actor_role ?? '',
      action_type: row.action,
      description: metadata.description ?? row.action,
      target_district: metadata.target_district ?? undefined,
    } as AuditLog
  })

  auditCache = {
    limit: safeLimit,
    timestamp: Date.now(),
    rows,
  }

  return rows
}
