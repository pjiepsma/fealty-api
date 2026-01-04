import type { TaskConfig } from 'payload'
import type { User } from '@/payload-types'

export const dailyDecayTask: TaskConfig = {
  slug: 'daily-decay',
  handler: async (args) => {
    const { req } = args
    try {
      // Get game config for decay settings
      const gameConfig = await req.payload.findGlobal({
        slug: 'game-config' as any,
      })

      const defaultDecayPercentage = gameConfig && typeof (gameConfig as any).defaultDecayPercentage === 'number'
        ? (gameConfig as any).defaultDecayPercentage
        : 5.0 // Fallback

      const maxDecayReduction = gameConfig && typeof (gameConfig as any).maxDecayReduction === 'number'
        ? (gameConfig as any).maxDecayReduction
        : 3.0 // Fallback

      const minimumDecayPercentage = Math.max(0, defaultDecayPercentage - maxDecayReduction)

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
            (reward: NonNullable<User['activeRewards']>[number]) => {
              if (!reward.isActive || reward.rewardType !== 'decay_reduction') {
                return false
              }

              // Check if reward has expired based on activatedAt + duration
              if (reward.activatedAt && reward.duration) {
                const activatedTime = new Date(reward.activatedAt).getTime()
                const durationMs = reward.duration * 60 * 60 * 1000
                const expiresAt = activatedTime + durationMs
                return expiresAt > new Date().getTime()
              }

              // If no duration/activation time, consider it active (unlimited)
              return true
            }
          )

          // Calculate total decay reduction from active rewards
          const totalDecayReduction = activeRewards.reduce((sum: number, reward: NonNullable<User['activeRewards']>[number]) => {
            return sum + (reward.rewardValue || 0)
          }, 0)

          // Calculate user's decay percentage (default - reduction, minimum configurable)
          const userDecayPercentage = Math.max(
            minimumDecayPercentage,
            defaultDecayPercentage - totalDecayReduction
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
