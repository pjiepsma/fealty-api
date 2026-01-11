<<<<<<< HEAD
import type { PayloadRequest } from 'payload'

export const expireChallengesTask = {
  slug: 'expire-challenges',
  handler: async (args: { req: PayloadRequest }) => {
    const { req } = args
    try {
      const now = new Date().toISOString()
=======
import { getPayload } from 'payload'
import config from '@payload-config'

export const runExpireChallenges = async () => {
  const timestamp = new Date().toISOString()
  console.log(`[TASK] 🗑️ Expired challenges cleanup started at ${timestamp}`)
>>>>>>> b331cb0b5995a1c81e5d01eca51f795f5c1f445a

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

    console.log(`✅ [TASK] Expired challenges cleanup completed: Deleted ${deletedCount} expired incomplete challenges`)

    return {
      success: true,
      deletedCount,
      timestamp,
      message: `Deleted ${deletedCount} expired incomplete challenges`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [TASK] Error in expired challenges cleanup:', errorMessage)
    throw error
  }
}
