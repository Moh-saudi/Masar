import { createBrowserClient } from '@/lib/supabase/client'

export async function logAudit({
  action,
  entity,
  entityId,
  metadata = {},
}: {
  action: string
  entity?: string
  entityId?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = createBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action,
    entity,
    entity_id: entityId,
    metadata,
  })
}
