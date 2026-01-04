import type { Payload } from 'payload'
import type { User, Reward } from '@/payload-types'

/**
 * Backend service for reward-related operations
 * Consolidates reward activation logic used by multiple API endpoints
 */
export class RewardService {
  /**
   * Activate a reward for a user
   * Used by challenge completion and buyout endpoints
   */
  static async activateReward(
    payload: Payload,
    userId: string,
    reward: Reward,
    challengeId?: string
  ): Promise<void> {
    // Get current month for season-based rewards
    const now = new Date()
    const season = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Get user's current active rewards
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    }) as User

    // Extract ActiveReward type from User's activeRewards field (which is an array)
    type ActiveReward = NonNullable<User['activeRewards']> extends (infer U)[] ? U : never

    const activeRewards = (user.activeRewards || []) as ActiveReward[]

    // Calculate expiry and uses
    let expiresAt: string | null = null
    if (reward.rewardDuration) {
      const expiryDate = new Date()
      expiryDate.setHours(expiryDate.getHours() + reward.rewardDuration)
      expiresAt = expiryDate.toISOString()
    }

    // Set uses remaining for use-based rewards
    let usesRemaining: number | null = null
    if (reward.rewardUses) {
      usesRemaining = reward.rewardUses
    }

    // Season-based rewards (like bonus_crowns) don't expire until season ends
    // Expiration is handled by API cron jobs (expire_season_rewards)
    if (reward.rewardType === 'bonus_crowns') {
      expiresAt = null
      usesRemaining = null
    }

    const activeReward: ActiveReward = {
      reward: reward.id,
      challengeId: challengeId || null,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue,
      expiresAt: expiresAt || undefined,
      season: reward.rewardType === 'bonus_crowns' ? season : undefined,
      usesRemaining: usesRemaining || undefined,
      isActive: true,
    } as ActiveReward

    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        activeRewards: [...activeRewards, activeReward],
      },
    })
  }
}

