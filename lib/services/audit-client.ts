import { createBrowserClient } from '@/lib/supabase/client'
import type { AuditLog } from '@/lib/types'

export async function fetchAuditTrail(limit = 100): Promise<AuditLog[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, entity, entity_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(Math.min(250, Math.max(1, limit)))

  if (error) throw error

  return (data ?? []).map((row: any) => {
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
}
