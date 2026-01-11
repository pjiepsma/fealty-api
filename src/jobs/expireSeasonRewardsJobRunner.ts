import type { PayloadRequest } from 'payload'
import { expireSeasonRewardsTask } from './expireSeasonRewardsJob'

export async function runExpireSeasonRewards(req: PayloadRequest): Promise<{ success: boolean; processedCount: number; expiredRewardsCount: number; expiredSeason: string }> {
  try {
    console.log('[MAINTENANCE] 🍂 Starting season rewards expiry...')

    const result = await expireSeasonRewardsTask.handler({ req })

    if (result.state === 'failed') {
      console.error('[MAINTENANCE] ❌ Season rewards expiry failed:', result.errorMessage)
      return { success: false, processedCount: 0, expiredRewardsCount: 0, expiredSeason: '' }
    }

    const processedCount = (result.output as any)?.processedCount || 0
    const expiredRewardsCount = (result.output as any)?.expiredRewardsCount || 0
    const expiredSeason = (result.output as any)?.expiredSeason || ''

    console.log(`[MAINTENANCE] ✅ Season rewards expiry completed: ${processedCount} users processed, ${expiredRewardsCount} rewards expired for season ${expiredSeason}`)

    return { success: true, processedCount, expiredRewardsCount, expiredSeason }
  } catch (error) {
    console.error('[MAINTENANCE] Error running season rewards expiry:', error)
    return { success: false, processedCount: 0, expiredRewardsCount: 0, expiredSeason: '' }
  }
}



