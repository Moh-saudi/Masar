import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/supabase/admin-auth'

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { admin, actor } = await requireSuperAdmin(
      request.headers.get('authorization')
    )

    const targetId = context.params.id
    const body = await request.json()
    const action = String(body?.action || '')

    const { data: target, error: targetError } = await admin
      .from('profiles')
      .select('id, email, full_name, role, role_title_ar, active')
      .eq('id', targetId)
      .single()

    if (targetError || !target) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    if (action === 'suspend' || action === 'activate') {
      if (targetId === actor.id && action === 'suspend') {
        return NextResponse.json({ error: 'CANNOT_SUSPEND_SELF' }, { status: 400 })
      }

      const active = action === 'activate'

      const { error } = await admin
        .from('profiles')
        .update({ active })
        .eq('id', targetId)

      if (error) throw error

      await admin.from('audit_logs').insert({
        user_id: actor.id,
        action: active ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_SUSPENDED',
        entity: 'profiles',
        entity_id: targetId,
        metadata: {
          actor_name: actor.full_name,
          actor_role: actor.role_title_ar,
          target_user_id: targetId,
          target_user_name: target.full_name,
          target_user_email: target.email,
          description: active
            ? `إعادة تفعيل حساب (${target.full_name})`
            : `إيقاف حساب (${target.full_name}) مؤقتًا`,
        },
      })

      return NextResponse.json({ success: true, active })
    }

    if (action === 'password') {
      const password = String(body?.password || '')
      if (password.length < 8) {
        return NextResponse.json({ error: 'PASSWORD_TOO_SHORT' }, { status: 400 })
      }

      const { error } = await admin.auth.admin.updateUserById(targetId, {
        password,
      })

      if (error) throw error

      await admin.from('audit_logs').insert({
        user_id: actor.id,
        action: 'ACCOUNT_PASSWORD_CHANGED',
        entity: 'profiles',
        entity_id: targetId,
        metadata: {
          actor_name: actor.full_name,
          actor_role: actor.role_title_ar,
          target_user_id: targetId,
          target_user_name: target.full_name,
          target_user_email: target.email,
          description: `تغيير كلمة مرور حساب (${target.full_name}) بواسطة مسؤول النظام`,
        },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : 500
    console.error('Admin user operation failed', error)
    return NextResponse.json({ error: code }, { status })
  }
}
