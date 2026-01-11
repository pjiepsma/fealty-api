import type { PayloadRequest } from 'payload'
import { dailyDecayTask } from './dailyDecayJob'

export async function runDailyDecay(req: PayloadRequest): Promise<{ success: boolean; processedCount: number; decayedUsersCount: number }> {
  try {
    console.log('[MAINTENANCE] 📉 Starting daily decay...')

    const result = await dailyDecayTask.handler({ req })

    if (result.state === 'failed') {
      console.error('[MAINTENANCE] ❌ Daily decay failed:', result.errorMessage)
      return { success: false, processedCount: 0, decayedUsersCount: 0 }
    }

    const processedCount = (result.output as any)?.processedCount || 0
    const decayedUsersCount = (result.output as any)?.decayedUsersCount || 0

    console.log(`[MAINTENANCE] ✅ Daily decay completed: ${processedCount} users processed, ${decayedUsersCount} users decayed`)

    return { success: true, processedCount, decayedUsersCount }
  } catch (error) {
    console.error('[MAINTENANCE] Error running daily decay:', error)
    return { success: false, processedCount: 0, decayedUsersCount: 0 }
  }
}



