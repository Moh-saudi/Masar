export type Role =
  | 'super_admin'
  | 'sector_head'
  | 'central_admin'
  | 'general_director'
  | 'directorate_user'
  | 'district_user'

const permissions: Record<Role, string[]> = {
  super_admin: ['users.manage','reports.view','reports.override'],
  sector_head: ['reports.view','reports.approve'],
  central_admin: ['reports.view','reports.review'],
  general_director: ['reports.view','reports.review'],
  directorate_user: ['reports.review','reports.approve'],
  district_user: ['reports.create','reports.submit']
}

export function can(role: Role, permission: string) {
  return permissions[role]?.includes(permission) ?? false
}
