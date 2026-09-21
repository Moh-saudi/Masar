import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return Boolean(
    url &&
    anonKey &&
    url !== 'https://YOUR_PROJECT.supabase.co' &&
    url !== 'https://your-project.supabase.co'
  )
}

export function createBrowserClient() {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  browserClient = createClient(url, anonKey)
  return browserClient
}
