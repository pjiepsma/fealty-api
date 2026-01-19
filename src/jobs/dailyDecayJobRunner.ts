import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'

export const runDailyDecay = async () => {
  const timestamp = new Date().toISOString()
  console.log(`[TASK] 📉 Daily decay started at ${timestamp}`)

  try {
    const payload = await getPayload({ config })

    // Get game config for decay settings
    const gameConfig = await payload.findGlobal({
      slug: 'game-config',
    })

    if (!gameConfig) {
      throw new Error('Game config not found')
    }

    if (typeof gameConfig.defaultDecayPercentage !== 'number') {
      throw new Error('Game config missing required field: defaultDecayPercentage')
    }
    if (typeof gameConfig.maxDecayReduction !== 'number') {
      throw new Error('Game config missing required field: maxDecayReduction')
    }

    const defaultDecayPercentage = gameConfig.defaultDecayPercentage
    const maxDecayReduction = gameConfig.maxDecayReduction

    const minimumDecayPercentage = Math.max(0, defaultDecayPercentage - maxDecayReduction)

    // Get all users with totalSeconds > 0
    const users = await payload.find({
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
        const totalSeconds = user.totalSeconds ?? 0

        if (totalSeconds <= 0) {
          continue
        }

        // Get user's active decay_reduction rewards
        const activeRewards = (user.activeRewards ?? []).filter(
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
          },
        )

        // Calculate total decay reduction from active rewards
        const totalDecayReduction = activeRewards.reduce(
          (sum: number, reward: NonNullable<User['activeRewards']>[number]) => {
            return sum + reward.rewardValue
          },
          0,
        )

        // Calculate user's decay percentage (default - reduction, minimum configurable)
        const userDecayPercentage = Math.max(
          minimumDecayPercentage,
          defaultDecayPercentage - totalDecayReduction,
        )

        // Apply decay
        const decayMultiplier = 1.0 - userDecayPercentage / 100.0
        const newTotalSeconds = Math.max(1, Math.floor(totalSeconds * decayMultiplier))

        // Only update if there's a change
        if (newTotalSeconds !== totalSeconds) {
          await payload.update({
            collection: 'users',
            id: user.id,
            data: {
              totalSeconds: newTotalSeconds,
            },
          })

          decayedUsersCount++
          console.log(
            `Daily decay for user ${user.id}: ${totalSeconds} → ${newTotalSeconds} (${userDecayPercentage.toFixed(1)}% decay)`,
          )
        }

        processedCount++
      } catch (error) {
        console.error(`Error processing decay for user ${user.id}:`, error)
      }
    }

    console.log(
      `✅ [TASK] Daily decay completed: Processed ${processedCount} users, applied decay to ${decayedUsersCount} users`,
    )

    return {
      success: true,
      processedCount,
      decayedUsersCount,
      timestamp,
      message: `Processed ${processedCount} users, applied decay to ${decayedUsersCount} users`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [TASK] Error in daily decay:', errorMessage)
    throw error
  }
}
