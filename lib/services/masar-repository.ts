import { MasarService } from '@/lib/masar-service'
import { cachedRequest, invalidateCache } from './request-cache'
import type { UserProfile } from '@/lib/types'

export async function getDistrictSubmissions() {
  return cachedRequest('district-submissions', async () => {
    return MasarService.getSubmissions()
  })
}

export async function updateDistrictSection(
  districtId: string,
  sectionCode: number,
  data: {
    field_1_value: number
    field_2_value: number
    field_3_value: number
    notes?: string
  },
  user: UserProfile
) {
  const result = MasarService.updateSectionData(districtId, sectionCode, data, user)
  invalidateCache('district-submissions')
  return result
}
