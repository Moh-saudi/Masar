import { createBrowserClient } from './supabase/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co'
)

/**
 * Compatibility export for older imports.
 * New code should import createBrowserClient from '@/lib/supabase/client'.
 */
export const supabase = isSupabaseConfigured ? createBrowserClient() : null
