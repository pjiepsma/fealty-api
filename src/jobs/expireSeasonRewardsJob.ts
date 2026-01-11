import type { PayloadRequest } from 'payload'
import type { User } from '@/payload-types'

/**
 * Get the previous month in YYYY-MM format
 */
function getPreviousMonth(): string {
  const now = new Date()
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const year = previousMonth.getFullYear()
  const month = String(previousMonth.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export const expireSeasonRewardsTask = {
  slug: 'expire-season-rewards',
  handler: async (args: { req: PayloadRequest }) => {
    const { req } = args
    try {
      // Get the previous month (season that just ended)
      const expiredSeason = getPreviousMonth()

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

          // Filter out season-based rewards for the expired season
          const validRewards = activeRewards.filter((reward: NonNullable<User['activeRewards']>[number]) => {
            // Remove season-based rewards (like bonus_crowns) for the expired season
            if (reward.season === expiredSeason && reward.rewardType === 'bonus_crowns') {
              expiredRewardsCount++
              return false
            }
            return true
          })

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
          console.error(`Error processing season rewards for user ${user.id}:`, error)
        }
      }

      console.log(
        `Expire season rewards completed: Processed ${processedCount} users, expired ${expiredRewardsCount} rewards for season ${expiredSeason}`
      )
      return {
        output: {
          success: true,
          processedCount,
          expiredRewardsCount,
          expiredSeason,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error in expireSeasonRewardsTask:', errorMessage)
      return {
        state: 'failed' as const,
        errorMessage,
      }
    }
  },
}



