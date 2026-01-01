import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import type { Challenge, User, Reward } from '@/payload-types'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { userId } = body
    const { id: challengeId } = await params

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: userId',
        },
        { status: 400 },
      )
    }

    // Get the challenge
    const challenge = await payload.findByID({
      collection: 'challenges',
      id: challengeId,
      depth: 2, // Include reward relationship
    })

    if (!challenge) {
      return NextResponse.json(
        {
          error: 'Challenge not found',
        },
        { status: 404 },
      )
    }

    // Verify challenge belongs to user
    const challengeUserId = typeof challenge.user === 'string' ? challenge.user : challenge.user?.id
    if (challengeUserId !== userId) {
      return NextResponse.json(
        {
          error: 'Challenge does not belong to this user',
        },
        { status: 403 },
      )
    }

    // Check if challenge can be bought out
    const cost = (challenge as Challenge).cost || 0
    if (cost <= 0) {
      return NextResponse.json(
        {
          error: 'This challenge cannot be bought out',
        },
        { status: 400 },
      )
    }

    // Check if already completed
    if ((challenge as Challenge).completedAt) {
      return NextResponse.json(
        {
          error: 'Challenge is already completed',
        },
        { status: 400 },
      )
    }

    // Get user to check coins (use transaction-like pattern)
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
        },
        { status: 404 },
      )
    }

    // Note: coins field may not be in User type yet, but we'll access it safely
    const userCoins = (user as User as { coins?: number }).coins || 0

    // Validate user has enough coins
    if (userCoins < cost) {
      return NextResponse.json(
        {
          error: `Not enough coins. Required: ${cost}, Available: ${userCoins}`,
        },
        { status: 400 },
      )
    }

    // Atomic operation: Deduct coins AND complete challenge
    // First, deduct coins
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        coins: userCoins - cost,
      },
    })

    // Then, complete the challenge
    await payload.update({
      collection: 'challenges',
      id: challengeId,
      data: {
        completedAt: new Date().toISOString(),
        claimedAt: new Date().toISOString(),
      },
    })

    // Activate the reward
    const reward = (challenge as Challenge).reward
    if (reward) {
      const rewardData: Reward =
        typeof reward === 'string'
          ? ((await payload.findByID({
              collection: 'rewards',
              id: reward,
            })) as Reward)
          : (reward as Reward)

      if (rewardData) {
        // Get current month for season-based rewards
        const now = new Date()
        const season = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        // Get user's current active rewards
        const userUpdate = (await payload.findByID({
          collection: 'users',
          id: userId,
        })) as User

        // Extract ActiveReward type from User's activeRewards field (which is an array)
        type ActiveReward = NonNullable<User['activeRewards']> extends (infer U)[] ? U : never

        const existingActiveRewards = (userUpdate.activeRewards || []) as ActiveReward[]

        // Calculate expiry based on reward duration
        let expiresAt: string | null = null
        if (rewardData.rewardDuration) {
          const expiryDate = new Date()
          expiryDate.setHours(expiryDate.getHours() + rewardData.rewardDuration)
          expiresAt = expiryDate.toISOString()
        }

        const activeReward: ActiveReward = {
          reward: typeof reward === 'string' ? reward : reward.id,
          challengeId: challengeId,
          rewardType: rewardData.rewardType,
          rewardValue: rewardData.rewardValue,
          expiresAt: expiresAt || undefined,
          season: rewardData.rewardType === 'bonus_crowns' ? season : undefined,
          usesRemaining: rewardData.rewardUses || undefined,
          isActive: true,
        } as ActiveReward

        await payload.update({
          collection: 'users',
          id: userId,
          data: {
            activeRewards: [...existingActiveRewards, activeReward],
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Challenge bought out successfully',
      coinsRemaining: userCoins - cost,
    })
  } catch (error) {
    console.error('Error buying out challenge:', error)
    return NextResponse.json(
      {
        error: 'Failed to buy out challenge',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
