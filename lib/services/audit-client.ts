import { createBrowserClient } from '@/lib/supabase/client'
import type { AuditLog } from '@/lib/types'

export async function fetchAuditTrail(): Promise<AuditLog[]> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(250)

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
