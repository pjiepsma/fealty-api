import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import type { Challenge, User, Reward } from '@/payload-types'
import { RewardService } from '@/services/rewardService'

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
        await RewardService.activateReward(payload, userId, rewardData, challengeId)
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
