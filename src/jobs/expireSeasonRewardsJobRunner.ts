import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'

function getPreviousMonth(): string {
  const now = new Date()
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const year = previousMonth.getFullYear()
  const month = String(previousMonth.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export async function runExpireSeasonRewards(): Promise<{ success: boolean; processedCount: number; expiredRewardsCount: number; expiredSeason: string; timestamp: string; message: string }> {
  const timestamp = new Date().toISOString()
  console.log(`[TASK] 📅 Season rewards expiration started at ${timestamp}`)

  try {
    const payload = await getPayload({ config })
    const expiredSeason = getPreviousMonth()

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
        const activeRewards = user.activeRewards ?? []

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
        console.error(`Error processing season rewards for user ${user.id}:`, error)
      }
    }

    console.log(`✅ [TASK] Season rewards expiration completed: Processed ${processedCount} users, expired ${expiredRewardsCount} rewards for season ${expiredSeason}`)

    return {
      success: true,
      processedCount,
      expiredRewardsCount,
      expiredSeason,
      timestamp,
      message: `Processed ${processedCount} users, expired ${expiredRewardsCount} rewards for season ${expiredSeason}`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [TASK] Error in season rewards expiration:', errorMessage)
    throw error
  }
}



