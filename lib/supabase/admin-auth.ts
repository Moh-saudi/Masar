import { createClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from './admin'

export async function requireSuperAdmin(authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED')
  }

  const token = authorizationHeader.slice('Bearer '.length)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) throw new Error('SUPABASE_NOT_CONFIGURED')

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) throw new Error('UNAUTHORIZED')

  const admin = createSupabaseAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, full_name, role, role_title_ar, active')
    .eq('id', data.user.id)
    .single()

  if (
    profileError ||
    !profile ||
    profile.active !== true ||
    profile.role !== 'super_admin'
  ) {
    throw new Error('FORBIDDEN')
  }

  return { admin, actor: profile }
}
