import { createServerSupabaseClient } from './server'
import { getCurrentUser } from './user'
import type { Permission, Role } from './permissions'
import { can } from './permissions'

export async function requireApiUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('UNAUTHORIZED')
  }

  return user
}

export async function requireApiPermission(permission: Permission) {
  const user = await getCurrentUser()

  if (!user || !user.active || !can(user.role as Role, permission)) {
    throw new Error('FORBIDDEN')
  }

  return user
}
