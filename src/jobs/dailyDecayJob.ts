import type { TaskConfig } from 'payload'

const DEFAULT_DECAY_PERCENTAGE = 5.0
const MINIMUM_DECAY_PERCENTAGE = 2.0

export const dailyDecayTask: TaskConfig = {
  slug: 'daily-decay',
  handler: async (args) => {
    const { req } = args
    try {
      // Get all users with totalSeconds > 0
      const users = await req.payload.find({
        collection: 'users',
        where: {
          totalSeconds: {
            greater_than: 0,
          },
        },
        limit: 1000, // Process in batches if needed
      })

      let processedCount = 0
      let decayedUsersCount = 0

      for (const user of users.docs) {
        try {
          const totalSeconds = user.totalSeconds || 0

          if (totalSeconds <= 0) {
            continue
          }

          // Get user's active decay_reduction rewards
          const activeRewards = (user.activeRewards || []).filter(
            (reward: any) =>
              reward.isActive &&
              reward.rewardType === 'decay_reduction' &&
              (!reward.expiresAt || new Date(reward.expiresAt) > new Date())
          )

          // Calculate total decay reduction from active rewards
          const totalDecayReduction = activeRewards.reduce((sum: number, reward: any) => {
            return sum + (reward.rewardValue || 0)
          }, 0)

          // Calculate user's decay percentage (default - reduction, minimum 2%)
          const userDecayPercentage = Math.max(
            MINIMUM_DECAY_PERCENTAGE,
            DEFAULT_DECAY_PERCENTAGE - totalDecayReduction
          )

          // Apply decay
          const decayMultiplier = 1.0 - userDecayPercentage / 100.0
          const newTotalSeconds = Math.max(1, Math.floor(totalSeconds * decayMultiplier))

          // Only update if there's a change
          if (newTotalSeconds !== totalSeconds) {
            await req.payload.update({
              collection: 'users',
              id: user.id,
              data: {
                totalSeconds: newTotalSeconds,
              },
            })

            decayedUsersCount++
            console.log(
              `Daily decay for user ${user.id}: ${totalSeconds} → ${newTotalSeconds} (${userDecayPercentage.toFixed(1)}% decay)`
            )
          }

          processedCount++
        } catch (error) {
          console.error(`Error processing decay for user ${user.id}:`, error)
        }
      }

      console.log(
        `Daily decay completed: Processed ${processedCount} users, applied decay to ${decayedUsersCount} users`
      )
      return {
        output: {
          success: true,
          processedCount,
          decayedUsersCount,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error in dailyDecayJob:', errorMessage)
      return {
        state: 'failed' as const,
        errorMessage,
      }
    }
  },
}
