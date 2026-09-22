import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/supabase/admin-auth'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { admin } = await requireSuperAdmin(
      request.headers.get('authorization')
    )

    const targetId = context.params.id

    const { data, error } = await admin
      .from('audit_logs')
      .select('id, action, metadata, created_at')
      .contains('metadata', { target_user_id: targetId })
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const logs = (data ?? []).map((row: any) => {
      const metadata = row.metadata ?? {}
      return {
        id: row.id,
        timestamp: new Date(row.created_at).toLocaleString('ar-EG'),
        actor_name: metadata.actor_name ?? 'مسؤول النظام',
        actor_role: metadata.actor_role ?? '',
        action_type: row.action,
        description: metadata.description ?? row.action,
      }
    })

    return NextResponse.json({ logs })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : 500
    console.error('Admin user audit load failed', error)
    return NextResponse.json({ error: code }, { status })
  }
}
