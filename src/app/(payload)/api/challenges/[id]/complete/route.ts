import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import type { Reward } from '@/payload-types'
import { RewardService } from '@/services/rewardService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { status: 400 }
      )
    }

    // Get the challenge with reward details
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
        { status: 404 }
      )
    }

    // Verify challenge belongs to user
    const challengeUserId = typeof challenge.user === 'string' ? challenge.user : challenge.user?.id
    if (challengeUserId !== userId) {
      return NextResponse.json(
        {
          error: 'Challenge does not belong to this user',
        },
        { status: 403 }
      )
    }

    // Check if already completed
    if (challenge.completedAt) {
      return NextResponse.json(
        {
          error: 'Challenge is already completed',
        },
        { status: 400 }
      )
    }

    // Server-side validation: Check if progress meets target
    const progress = challenge.progress || 0
    const targetValue = challenge.targetValue || 0

    if (progress < targetValue) {
      return NextResponse.json(
        {
          error: `Challenge not yet completed. Progress: ${progress}/${targetValue}`,
        },
        { status: 400 }
      )
    }

    // Check if challenge has expired
    const expiresAt = challenge.expiresAt
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return NextResponse.json(
        {
          error: 'Challenge has expired',
        },
        { status: 400 }
      )
    }

    // Mark challenge as completed
    await payload.update({
      collection: 'challenges',
      id: challengeId,
      data: {
        completedAt: new Date().toISOString(),
      },
    })

    // Give coins bonus based on difficulty (always, regardless of reward)
    if (!challenge.rewardDifficulty) {
      throw new Error(`Challenge ${challengeId} missing rewardDifficulty`)
    }

    const coinsToAdd = challenge.rewardDifficulty
    if (coinsToAdd > 0) {
      const user = await payload.findByID({
        collection: 'users',
        id: userId,
      })

      if (typeof user.coins !== 'number') {
        throw new Error(`User ${userId} missing coins field`)
      }

      const currentCoins = user.coins
      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          coins: currentCoins + coinsToAdd,
        },
      })

      console.log(`[CHALLENGE] Added ${coinsToAdd} coins to user ${userId} for completing challenge ${challengeId} (total: ${currentCoins + coinsToAdd})`)
    }

    // Activate the reward
    const reward = challenge.reward
    if (reward) {
      let rewardData: Reward
      
      if (typeof reward === 'string') {
        const fetchedReward = await payload.findByID({
          collection: 'rewards',
          id: reward,
        })
        if (!fetchedReward) {
          throw new Error(`Reward ${reward} not found`)
        }
        rewardData = fetchedReward
      } else {
        rewardData = reward
      }

      await RewardService.activateReward(payload, userId, rewardData, challengeId)
    } 

    return NextResponse.json({
      success: true,
      message: 'Challenge completed successfully',
    })
  } catch (error) {
    console.error('Error completing challenge:', error)
    return NextResponse.json(
      {
        error: 'Failed to complete challenge',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


