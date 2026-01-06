import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'

export async function runExpireOldRewards(): Promise<{ success: boolean; processedCount: number; expiredRewardsCount: number; timestamp: string; message: string }> {
  const timestamp = new Date().toISOString()
  console.log(`[TASK] 🧽 Expired rewards cleanup started at ${timestamp}`)

  try {
    const payload = await getPayload({ config })
    const now = new Date()

    // Get all users with activeRewards
    const users = await payload.find({
      collection: 'users',
      where: {
        activeRewards: {
          exists: true,
        },
      },
      limit: 1000,
    })

    let processedCount = 0
    let expiredRewardsCount = 0

    for (const user of users.docs) {
      try {
        const activeRewards = (user.activeRewards || []) as NonNullable<User['activeRewards']>

        // Filter out expired or inactive rewards
        const validRewards = activeRewards.filter((reward: NonNullable<User['activeRewards']>[number]) => {
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
        })

        // Only update if rewards were removed
        if (validRewards.length !== activeRewards.length) {
          await payload.update({
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

    console.log(`✅ [TASK] Expired rewards cleanup completed: Processed ${processedCount} users, expired ${expiredRewardsCount} rewards`)

    return {
      success: true,
      processedCount,
      expiredRewardsCount,
      timestamp,
      message: `Processed ${processedCount} users, expired ${expiredRewardsCount} rewards`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [TASK] Error in expired rewards cleanup:', errorMessage)
    throw error
  }
}
