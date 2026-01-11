import type { PayloadRequest } from 'payload'
import { calculateKingStatusTask } from './calculateKingStatusJob'

export async function runCalculateKingStatus(
  req: PayloadRequest,
): Promise<{ success: boolean; processedCount: number; updatedCount: number }> {
  try {
    console.log('[MAINTENANCE] 👑 Starting king status calculation...')

    const result = await calculateKingStatusTask.handler({ req })

    if (result.state === 'failed') {
      console.error('[MAINTENANCE] ❌ King status calculation failed:', result.errorMessage)
      return { success: false, processedCount: 0, updatedCount: 0 }
    }

    const processedCount = (result.output as any)?.processedCount || 0
    const updatedCount = (result.output as any)?.updatedCount || 0

    console.log(
      `[MAINTENANCE] ✅ King status calculation completed: ${processedCount} POIs processed, ${updatedCount} kings updated`,
    )

    return { success: true, processedCount, updatedCount }
  } catch (error) {
    console.error('[MAINTENANCE] Error running king status calculation:', error)
    return { success: false, processedCount: 0, updatedCount: 0 }
  }
}



