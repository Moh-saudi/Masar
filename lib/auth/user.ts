import { createServerSupabaseClient } from './server'
import type { Role } from './permissions'

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, national_id, role, role_title_ar, active, governorate_id, governorate_name_ar, district_id, district_name_ar')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null

  return {
    ...user,
    ...profile,
    role: profile.role as Role,
    active: profile.active ?? false,
  }
}
