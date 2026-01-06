import type { PayloadRequest } from 'payload'
import { expireChallengesTask } from './expireChallengesJob'

export async function runExpireChallenges(req: PayloadRequest): Promise<{ success: boolean; deletedCount: number }> {
  try {
    console.log('[MAINTENANCE] 🧹 Starting expired challenges cleanup...')

    const result = await expireChallengesTask.handler({ req })

    if (result.state === 'failed') {
      console.error('[MAINTENANCE] ❌ Expired challenges cleanup failed:', result.errorMessage)
      return { success: false, deletedCount: 0 }
    }

    const deletedCount = (result.output as any)?.deletedCount || 0
    console.log(`[MAINTENANCE] ✅ Expired challenges cleanup completed: ${deletedCount} challenges removed`)

    return { success: true, deletedCount }
  } catch (error) {
    console.error('[MAINTENANCE] Error running expired challenges cleanup:', error)
    return { success: false, deletedCount: 0 }
  }
}
