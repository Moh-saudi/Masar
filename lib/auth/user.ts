import { createBrowserClient } from '@/lib/supabase/client'
import type { Role } from './permissions'

export async function getCurrentUser() {
  const supabase = createBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single()

  return {
    ...user,
    role: profile?.role as Role,
    active: profile?.active ?? false,
  }
}
