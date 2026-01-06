import type { PayloadRequest } from 'payload'
import { expireOldRewardsTask } from './expireOldRewardsJob'

export async function runExpireOldRewards(req: PayloadRequest): Promise<{ success: boolean; processedCount: number; expiredRewardsCount: number }> {
  try {
    console.log('[MAINTENANCE] 🧽 Starting expired rewards cleanup...')

    const result = await expireOldRewardsTask.handler({ req })

    if (result.state === 'failed') {
      console.error('[MAINTENANCE] ❌ Expired rewards cleanup failed:', result.errorMessage)
      return { success: false, processedCount: 0, expiredRewardsCount: 0 }
    }

    const processedCount = (result.output as any)?.processedCount || 0
    const expiredRewardsCount = (result.output as any)?.expiredRewardsCount || 0

    console.log(`[MAINTENANCE] ✅ Expired rewards cleanup completed: ${processedCount} users processed, ${expiredRewardsCount} rewards expired`)

    return { success: true, processedCount, expiredRewardsCount }
  } catch (error) {
    console.error('[MAINTENANCE] Error running expired rewards cleanup:', error)
    return { success: false, processedCount: 0, expiredRewardsCount: 0 }
  }
}
