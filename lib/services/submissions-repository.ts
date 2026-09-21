import { createBrowserClient } from '@/lib/supabase/client'
import { cachedRequest, invalidateCache } from './request-cache'
import type { DailySubmission } from '@/lib/types'

const CACHE_KEY = 'daily-submissions'

export async function getSubmissionsFromDatabase() {
  return cachedRequest(CACHE_KEY, async () => {
    const supabase = createBrowserClient()

    const { data, error } = await supabase
      .from('daily_submissions')
      .select('*')
      .order('submission_date', { ascending: false })

    if (error) throw error
    return data as DailySubmission[]
  })
}

export async function saveSubmissionToDatabase(submission: Partial<DailySubmission>) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('daily_submissions')
    .upsert(submission)
    .select()
    .single()

  if (error) throw error

  invalidateCache(CACHE_KEY)
  return data
}
