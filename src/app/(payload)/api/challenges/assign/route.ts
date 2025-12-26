import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: userId',
        },
        { status: 400 }
      )
    }

    // Get all active rewards to choose from
    const rewards = await payload.find({
      collection: 'rewards',
      where: {
        isActive: {
          equals: true,
        },
      },
      limit: 1000,
    })

    if (rewards.docs.length === 0) {
      return NextResponse.json(
        {
          error: 'No active rewards found',
        },
        { status: 400 }
      )
    }

    // Check existing challenges for this user
    const existingChallenges = await payload.find({
      collection: 'challenges',
      where: {
        and: [
          {
            user: {
              equals: userId,
            },
          },
          {
            expiresAt: {
              greater_than: new Date().toISOString(),
            },
          },
        ],
      },
      limit: 100,
    })

    const assignedChallenges = []

    // Generate daily challenges (1-3 difficulty)
    const dailyChallenges = [
      {
        type: 'daily',
        title: 'Daily Entry Challenge',
        description: 'Make 3 entries today',
        challengeType: 'entry_count',
        targetValue: 3,
        rewardDifficulty: 2,
      },
      {
        type: 'daily',
        title: 'Daily Crown Challenge',
        description: 'Become king of 1 POI today',
        challengeType: 'crown_count',
        targetValue: 1,
        rewardDifficulty: 3,
      },
    ]

    for (const challengeTemplate of dailyChallenges) {
      // Check if user already has this type of challenge
      const hasExisting = existingChallenges.docs.some(
        (c: any) => c.type === challengeTemplate.type && c.challengeType === challengeTemplate.challengeType
      )

      if (hasExisting) {
        continue
      }

      // Get a random reward for the difficulty level
      const availableRewards = rewards.docs.filter(
        (r: any) => r.difficulty === challengeTemplate.rewardDifficulty
      )

      if (availableRewards.length === 0) {
        console.warn(`No rewards found for difficulty ${challengeTemplate.rewardDifficulty}`)
        continue
      }

      const randomReward = availableRewards[Math.floor(Math.random() * availableRewards.length)]

      // Calculate expiration date (end of today)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 1)
      expiresAt.setHours(0, 0, 0, 0)

      // Create challenge
      const challenge = await payload.create({
        collection: 'challenges',
        data: {
          user: userId,
          type: challengeTemplate.type,
          title: challengeTemplate.title,
          description: challengeTemplate.description,
          challengeType: challengeTemplate.challengeType,
          targetValue: challengeTemplate.targetValue,
          rewardDifficulty: challengeTemplate.rewardDifficulty,
          reward: randomReward.id,
          progress: 0,
          expiresAt: expiresAt.toISOString(),
          isPersonal: true,
          cost: 0,
        },
      })

      assignedChallenges.push(challenge)
    }

    // Generate weekly challenges (4-6 difficulty)
    const weeklyChallenges = [
      {
        type: 'weekly',
        title: 'Weekly Entry Challenge',
        description: 'Make 10 entries this week',
        challengeType: 'entry_count',
        targetValue: 10,
        rewardDifficulty: 5,
      },
      {
        type: 'weekly',
        title: 'Weekly Crown Challenge',
        description: 'Become king of 3 POIs this week',
        challengeType: 'crown_count',
        targetValue: 3,
        rewardDifficulty: 6,
      },
    ]

    for (const challengeTemplate of weeklyChallenges) {
      // Check if user already has this type of challenge
      const hasExisting = existingChallenges.docs.some(
        (c: any) => c.type === challengeTemplate.type && c.challengeType === challengeTemplate.challengeType
      )

      if (hasExisting) {
        continue
      }

      // Get a random reward for the difficulty level
      const availableRewards = rewards.docs.filter(
        (r: any) => r.difficulty === challengeTemplate.rewardDifficulty
      )

      if (availableRewards.length === 0) {
        console.warn(`No rewards found for difficulty ${challengeTemplate.rewardDifficulty}`)
        continue
      }

      const randomReward = availableRewards[Math.floor(Math.random() * availableRewards.length)]

      // Calculate expiration date (end of week)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)
      expiresAt.setHours(0, 0, 0, 0)

      // Create challenge
      const challenge = await payload.create({
        collection: 'challenges',
        data: {
          user: userId,
          type: challengeTemplate.type,
          title: challengeTemplate.title,
          description: challengeTemplate.description,
          challengeType: challengeTemplate.challengeType,
          targetValue: challengeTemplate.targetValue,
          rewardDifficulty: challengeTemplate.rewardDifficulty,
          reward: randomReward.id,
          progress: 0,
          expiresAt: expiresAt.toISOString(),
          isPersonal: false,
          cost: 0,
        },
      })

      assignedChallenges.push(challenge)
    }

    return NextResponse.json({
      success: true,
      assignedChallenges,
    })
  } catch (error) {
    console.error('Error assigning challenges:', error)
    return NextResponse.json(
      {
        error: 'Failed to assign challenges',
      },
      { status: 500 }
    )
  }
}
