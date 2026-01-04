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

    let activeRewards = (user.activeRewards || []) as ActiveReward[]

    // Clean up expired active rewards - mark them as inactive if they have uses left, remove if no uses
    activeRewards = activeRewards.map((reward: ActiveReward) => {
      if (reward.isActive && reward.activatedAt && reward.duration) {
        const activatedTime = new Date(reward.activatedAt).getTime()
        const durationMs = reward.duration * 60 * 60 * 1000
        const expiresAt = activatedTime + durationMs

        if (expiresAt <= now.getTime()) {
          // Reward has expired
          const hasUsesLeft = reward.usesRemaining === null ||
                             reward.usesRemaining === undefined ||
                             reward.usesRemaining > 0

          if (hasUsesLeft) {
            // Mark as inactive but keep for reactivation
            return { ...reward, isActive: false }
          } else {
            // Remove completely - return null and filter out later
            return null
          }
        }
      }
      return reward
    }).filter((reward): reward is ActiveReward => reward !== null)

    // Store activation time and duration
    const activatedAt = new Date().toISOString()
    let duration: number | null = null
    if (reward.rewardDuration) {
      duration = reward.rewardDuration
    }

    // Set uses remaining for use-based rewards
    let usesRemaining: number | null = null
    if (reward.rewardUses) {
      usesRemaining = reward.rewardUses
    }

    // Season-based rewards (like bonus_crowns) are unlimited
    if (reward.rewardType === 'bonus_crowns') {
      duration = null
      usesRemaining = null
    }

    const activeReward: ActiveReward = {
      reward: reward.id,
      challengeId: challengeId || null,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue,
      activatedAt,
      duration,
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

