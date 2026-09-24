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

    if (action === 'update_profile') {
      const {
        full_name,
        national_id,
        email,
        role,
        role_title_ar,
        governorate_id,
        governorate_name_ar,
        district_id,
        district_name_ar,
      } = body

      const updateData: Record<string, unknown> = {}
      if (typeof full_name === 'string' && full_name.trim()) {
        updateData.full_name = full_name.trim()
      }
      if (typeof national_id === 'string') {
        updateData.national_id = national_id.trim() || null
      }
      if (typeof role === 'string' && role) {
        updateData.role = role
      }
      if (typeof role_title_ar === 'string' && role_title_ar.trim()) {
        updateData.role_title_ar = role_title_ar.trim()
      }

      // Update email if provided and valid
      if (typeof email === 'string' && email.trim() && email.trim() !== target.email) {
        const cleanEmail = email.trim()
        updateData.email = cleanEmail
        try {
          await admin.auth.admin.updateUserById(targetId, { email: cleanEmail })
        } catch (authErr) {
          console.error('Failed to update email in auth.users', authErr)
        }
      }

      // Handle geographic scoping based on role
      const effectiveRole = (updateData.role as string) || target.role
      if (effectiveRole === 'district_user') {
        updateData.governorate_id = governorate_id || null
        updateData.governorate_name_ar = governorate_name_ar || null
        updateData.district_id = district_id || null
        updateData.district_name_ar = district_name_ar || null
      } else if (effectiveRole === 'directorate_user') {
        updateData.governorate_id = governorate_id || null
        updateData.governorate_name_ar = governorate_name_ar || null
        updateData.district_id = null
        updateData.district_name_ar = null
      } else {
        updateData.governorate_id = null
        updateData.governorate_name_ar = null
        updateData.district_id = null
        updateData.district_name_ar = null
      }

      const { data: updatedProfile, error: updateError } = await admin
        .from('profiles')
        .update(updateData)
        .eq('id', targetId)
        .select('id, email, full_name, national_id, role, role_title_ar, active, governorate_id, governorate_name_ar, district_id, district_name_ar')
        .single()

      if (updateError) throw updateError

      await admin.from('audit_logs').insert({
        user_id: actor.id,
        action: 'ACCOUNT_PROFILE_UPDATED',
        entity: 'profiles',
        entity_id: targetId,
        metadata: {
          actor_name: actor.full_name,
          actor_role: actor.role_title_ar,
          target_user_id: targetId,
          target_user_name: updatedProfile.full_name,
          target_user_email: updatedProfile.email,
          description: `تعديل بيانات وصلاحيات حساب (${updatedProfile.full_name}) بواسطة مسؤول النظام`,
          changes: updateData,
        },
      })

      return NextResponse.json({ success: true, profile: updatedProfile })
    }

    return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : 500
    console.error('Admin user operation failed', error)
    return NextResponse.json({ error: code }, { status })
  }
}
