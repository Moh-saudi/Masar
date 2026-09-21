import { redirect } from 'next/navigation'
import { getCurrentUser } from './user'
import type { Permission, Role } from './permissions'
import { can } from './permissions'

export async function requireUser() {
  const user = await getCurrentUser()

  if (!user || !user.active) {
    redirect('/login')
  }

  return user
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser()

  if (!roles.includes(user.role)) {
    redirect('/unauthorized')
  }

  return user
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser()

  if (!can(user.role, permission)) {
    redirect('/unauthorized')
  }

  return user
}
