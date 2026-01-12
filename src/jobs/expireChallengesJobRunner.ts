import { getPayload } from 'payload'
import config from '@payload-config'

export async function runExpireChallenges(): Promise<{ success: boolean; deletedCount: number }> {
  const timestamp = new Date().toISOString()
  console.log(`[TASK] 🗑️ Expired challenges cleanup started at ${timestamp}`)

  try {
    const payload = await getPayload({ config })
    const now = new Date().toISOString()

    // Find all expired incomplete challenges
    const expiredChallenges = await payload.find({
      collection: 'challenges',
      where: {
        and: [
          {
            expiresAt: {
              less_than: now,
            },
          },
          {
            completedAt: {
              exists: false,
            },
          },
        ],
      },
      limit: 1000, // Process in batches
    })

    let deletedCount = 0

    // Delete expired challenges
    for (const challenge of expiredChallenges.docs) {
      try {
        await payload.delete({
          collection: 'challenges',
          id: challenge.id,
        })
        deletedCount++
      } catch (error) {
        console.error(`Error deleting challenge ${challenge.id}:`, error)
      }
    }

    console.log(
      `[TASK] ✅ Expired challenges cleanup completed: Deleted ${deletedCount} expired incomplete challenges`,
    )

    return { success: true, deletedCount }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[TASK] ❌ Error in expired challenges cleanup:', errorMessage)
    return { success: false, deletedCount: 0 }
  }
}
