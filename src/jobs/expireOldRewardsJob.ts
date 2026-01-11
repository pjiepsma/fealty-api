import type { PayloadRequest } from 'payload'
import type { User } from '@/payload-types'

export const expireOldRewardsTask = {
  slug: 'expire-old-rewards',
  handler: async (args: { req: PayloadRequest }) => {
    const { req } = args
    try {
      const now = new Date()

      // Get all users with activeRewards
      const users = await req.payload.find({
        collection: 'users',
        where: {
          activeRewards: {
            exists: true,
          },
        },
        limit: 1000, // Process in batches
      })

      let processedCount = 0
      let expiredRewardsCount = 0

      for (const user of users.docs) {
        try {
          const activeRewards = (user.activeRewards || []) as NonNullable<User['activeRewards']>

          // Filter out expired or inactive rewards
          const validRewards = activeRewards.filter(
            (reward: NonNullable<User['activeRewards']>[number]) => {
              // Remove inactive rewards
              if (!reward.isActive) {
                expiredRewardsCount++
                return false
              }

              // Remove expired time-based rewards
              if (reward.activatedAt && reward.duration) {
                const activatedTime = new Date(reward.activatedAt).getTime()
                const durationMs = reward.duration * 60 * 60 * 1000
                const expiresAt = activatedTime + durationMs
                if (expiresAt < now.getTime()) {
                  expiredRewardsCount++
                  return false
                }
              }

              // Remove use-based rewards with no uses remaining
              if (reward.usesRemaining != null && reward.usesRemaining <= 0) {
                expiredRewardsCount++
                return false
              }

              return true
            },
          )

          // Only update if rewards were removed
          if (validRewards.length !== activeRewards.length) {
            await req.payload.update({
              collection: 'users',
              id: user.id,
              data: {
                activeRewards: validRewards,
              },
            })
          }

          processedCount++
        } catch (error) {
          console.error(`Error processing rewards for user ${user.id}:`, error)
        }
      }

      console.log(
        `Expire old rewards completed: Processed ${processedCount} users, expired ${expiredRewardsCount} rewards`,
      )
      return {
        output: {
          success: true,
          processedCount,
          expiredRewardsCount,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error in expireOldRewardsTask:', errorMessage)
      return {
        state: 'failed' as const,
        errorMessage,
      }
    }
  },
}
