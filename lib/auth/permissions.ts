export type Role =
  | 'super_admin'
  | 'sector_head'
  | 'central_admin'
  | 'general_director'
  | 'directorate_user'
  | 'district_user'

export type Permission =
  | 'users.manage'
  | 'reports.view'
  | 'reports.create'
  | 'reports.approve'
  | 'reports.override'

const permissions: Record<Role, Permission[]> = {
  super_admin: [
    'users.manage',
    'reports.view',
    'reports.create',
    'reports.approve',
    'reports.override',
  ],
  sector_head: ['reports.view', 'reports.approve'],
  central_admin: ['reports.view', 'reports.approve'],
  general_director: ['reports.view', 'reports.approve'],
  directorate_user: ['reports.view', 'reports.approve'],
  district_user: ['reports.view', 'reports.create'],
}

export function can(role: Role, permission: Permission) {
  return permissions[role]?.includes(permission) ?? false
}
