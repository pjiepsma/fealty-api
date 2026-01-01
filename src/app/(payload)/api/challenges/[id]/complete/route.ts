import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import type { User, Reward } from '@/payload-types'

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
            activeRewards: [...activeRewards, activeReward],
          },
        })
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

