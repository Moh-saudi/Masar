import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return false

  const lowerUrl = url.toLowerCase()
  return (
    !lowerUrl.includes('your_project') &&
    !lowerUrl.includes('your-project') &&
    !anonKey.includes('YOUR_SUPABASE_ANON_KEY')
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
