import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import type { User, Reward } from '@/payload-types'
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

    // Activate the reward
    const reward = challenge.reward
    if (reward) {
      const rewardData: Reward = typeof reward === 'string'
        ? await payload.findByID({
            collection: 'rewards',
            id: reward,
          }) as Reward
        : reward as Reward

      if (rewardData) {
        await RewardService.activateReward(payload, userId, rewardData, challengeId)
      }
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


