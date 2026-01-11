import type { PayloadRequest } from 'payload'

export const expireChallengesTask = {
  slug: 'expire-challenges',
  handler: async (args: { req: PayloadRequest }) => {
    const { req } = args
    try {
      const now = new Date().toISOString()

      // Find all expired incomplete challenges
      const expiredChallenges = await req.payload.find({
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
          await req.payload.delete({
            collection: 'challenges',
            id: challenge.id,
          })
          deletedCount++
        } catch (error) {
          console.error(`Error deleting challenge ${challenge.id}:`, error)
        }
      }

      console.log(`Expired challenges cleanup: Deleted ${deletedCount} expired incomplete challenges`)
      return {
        output: {
          success: true,
          deletedCount,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error in expireChallengesJob:', errorMessage)
      return {
        state: 'failed' as const,
        errorMessage,
      }
    }
  },
}
