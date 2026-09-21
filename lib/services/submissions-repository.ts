import { createServerSupabaseClient } from '@/lib/auth/server'
import type { DailySubmission } from '@/lib/types'

export async function getSubmissionsFromDatabase(): Promise<DailySubmission[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('daily_submissions')
    .select('*')
    .order('submission_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as DailySubmission[]
}

export async function saveSubmissionToDatabase(
  submission: Partial<DailySubmission>
): Promise<DailySubmission> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('daily_submissions')
    .upsert(submission, { onConflict: 'submission_date,district_id' })
    .select('*')
    .single()

  if (error) throw error
  return data as DailySubmission
}
