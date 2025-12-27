import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import type { Challenge, Reward } from '@/payload-types'
import { generateTitle, generateDescription, getAvailableCategories } from '@/config/challengeRules'
import type { ChallengeType } from '@/config/challengeRules'
import type { Payload, PayloadRequest } from 'payload'

// Helper function to get random targetValue between min and max presets
async function getRandomTargetValue(
  payload: Payload,
  challengeType: ChallengeType,
  period: 'daily' | 'weekly',
): Promise<number | null> {
  try {
    const config = await payload.findGlobal({
      slug: 'challenge-config',
    })

    if (!config) {
      return null
    }

    // Convert challengeType from snake_case to camelCase
    const camelCaseType = challengeType
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
    const fieldName = `${period}${camelCaseType}` as keyof typeof config
    const presetGroup = config[fieldName] as
      | { easy?: number; medium?: number; hard?: number }
      | undefined

    if (!presetGroup) {
      return null
    }

    const values: number[] = []
    if (typeof presetGroup.easy === 'number') values.push(presetGroup.easy)
    if (typeof presetGroup.medium === 'number') values.push(presetGroup.medium)
    if (typeof presetGroup.hard === 'number') values.push(presetGroup.hard)

    if (values.length === 0) {
      return null
    }

    let min = Math.min(...values)
    let max = Math.max(...values)

    // Validate daily challenge limits
    if (period === 'daily') {
      // Daily challenges: maximum 60 minutes (3600 seconds) for session-based challenges
      if (challengeType === 'longest_session' || challengeType === 'session_duration') {
        const maxSeconds = 3600 // 60 minutes
        max = Math.min(max, maxSeconds)
        min = Math.min(min, maxSeconds)

        // If all presets exceed the limit, return null (invalid configuration)
        if (min > maxSeconds) {
          console.warn(
            `Daily ${challengeType} challenge: all presets exceed 60 minute limit, skipping`,
          )
          return null
        }
      }
    }

    // Return random integer between min and max (inclusive)
    return Math.floor(Math.random() * (max - min + 1)) + min
  } catch (error) {
    console.error('Error getting random target value:', error)
    return null
  }
}

// Helper function to get random reward difficulty within bracket
function getRandomRewardDifficulty(period: 'daily' | 'weekly' | 'monthly'): number {
  if (period === 'daily') {
    // Daily: 1-4 bracket (makkelijker)
    return Math.floor(Math.random() * 4) + 1
  } else if (period === 'weekly') {
    // Weekly: 2-8 bracket
    return Math.floor(Math.random() * 7) + 2
  } else {
    // Monthly: 6-9 bracket
    return Math.floor(Math.random() * 4) + 6
  }
}

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
        { status: 400 },
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
        { status: 400 },
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
    const usedDailyTypes: ChallengeType[] = []

    // Generate daily challenges (1-4 difficulty bracket)
    // Get all available challenge types and shuffle to avoid duplicates
    const allDailyTypes: ChallengeType[] = [
      'entry_count',
      'crown_claim',
      'session_duration',
      'longest_session',
      'unique_pois',
      'category_variety',
      'category_similarity',
      'new_location',
    ]

    // Shuffle array to randomize order
    const shuffledDailyTypes = [...allDailyTypes].sort(() => Math.random() - 0.5)

    // Limit to max 3 daily challenges to ensure variety
    const dailyChallengesToGenerate = Math.min(3, shuffledDailyTypes.length)

    for (let i = 0; i < dailyChallengesToGenerate; i++) {
      const challengeType = shuffledDailyTypes[i]

      // Skip if this type is already used
      if (usedDailyTypes.includes(challengeType)) {
        continue
      }

      const challengeTemplate = {
        type: 'daily' as const,
        challengeType: challengeType as ChallengeType,
      }

      usedDailyTypes.push(challengeType)
      // Check if user already has this type of challenge
      const hasExisting = existingChallenges.docs.some(
        (c: Challenge) =>
          c.type === challengeTemplate.type && c.challengeType === challengeTemplate.challengeType,
      )

      if (hasExisting) {
        continue
      }

      // Get random targetValue between min and max presets
      let targetValue = await getRandomTargetValue(
        payload,
        challengeTemplate.challengeType,
        'daily',
      )

      if (!targetValue) {
        console.warn(`No presets found for ${challengeTemplate.challengeType} daily, skipping`)
        continue
      }

      // Additional safety check: cap longest_session at 60 minutes for daily challenges
      if (challengeTemplate.challengeType === 'longest_session' && targetValue > 3600) {
        console.warn(
          `Daily longest_session challenge: targetValue ${targetValue}s exceeds 60 minute limit, capping at 3600s`,
        )
        targetValue = 3600
      }

      // Select category for category-specific challenges (before calculating reward difficulty)
      let targetCategory: string | undefined
      let categoryAdjustment = 0
      if (
        challengeTemplate.challengeType === 'category_similarity' ||
        challengeTemplate.challengeType === 'entry_count'
      ) {
        const categories = await getAvailableCategories({ payload } as PayloadRequest)
        if (categories.length > 0) {
          const randomCategory = categories[Math.floor(Math.random() * categories.length)]
          targetCategory = randomCategory.category
          categoryAdjustment = randomCategory.difficultyAdjustment || 0
        }
      }

      // Get reward difficulty with category adjustment
      let rewardDifficulty = getRandomRewardDifficulty('daily')
      if (categoryAdjustment > 0) {
        rewardDifficulty = Math.min(9, rewardDifficulty + categoryAdjustment)
      }

      // Get a random reward for the difficulty level
      const availableRewards = rewards.docs.filter((r: Reward) => r.difficulty === rewardDifficulty)

      if (availableRewards.length === 0) {
        console.warn(`No rewards found for difficulty ${rewardDifficulty}`)
        continue
      }

      const randomReward = availableRewards[Math.floor(Math.random() * availableRewards.length)]

      // Generate title and description dynamically
      const title = generateTitle(
        challengeTemplate.challengeType,
        targetValue,
        'daily',
        targetCategory,
      )
      const description = generateDescription(
        challengeTemplate.challengeType,
        targetValue,
        'daily',
        targetCategory,
      )

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
          title,
          description,
          challengeType: challengeTemplate.challengeType,
          targetValue,
          targetCategory,
          rewardDifficulty,
          reward: randomReward.id,
          progress: 0,
          expiresAt: expiresAt.toISOString(),
          isPersonal: true,
          cost: 0,
        },
      })

      assignedChallenges.push(challenge)
    }

    // Generate weekly challenges (2-8 difficulty bracket)
    // Get all available challenge types and shuffle to avoid duplicates
    const allWeeklyTypes: ChallengeType[] = [
      'entry_count',
      'crown_claim',
      'session_duration',
      'longest_session',
      'unique_pois',
      'category_variety',
      'category_similarity',
      'new_location',
    ]

    // Shuffle array to randomize order
    const shuffledWeeklyTypes = [...allWeeklyTypes].sort(() => Math.random() - 0.5)
    const usedWeeklyTypes: ChallengeType[] = []

    // Limit to max 3 weekly challenges to ensure variety
    const weeklyChallengesToGenerate = Math.min(3, shuffledWeeklyTypes.length)

    for (let i = 0; i < weeklyChallengesToGenerate; i++) {
      const challengeType = shuffledWeeklyTypes[i]

      // Skip if this type is already used
      if (usedWeeklyTypes.includes(challengeType)) {
        continue
      }

      const challengeTemplate = {
        type: 'weekly' as const,
        challengeType: challengeType as ChallengeType,
      }

      usedWeeklyTypes.push(challengeType)
      // Check if user already has this type of challenge
      const hasExisting = existingChallenges.docs.some(
        (c: Challenge) =>
          c.type === challengeTemplate.type && c.challengeType === challengeTemplate.challengeType,
      )

      if (hasExisting) {
        continue
      }

      // Get random targetValue between min and max presets
      const targetValue = await getRandomTargetValue(
        payload,
        challengeTemplate.challengeType,
        'weekly',
      )

      if (!targetValue) {
        console.warn(`No presets found for ${challengeTemplate.challengeType} weekly, skipping`)
        continue
      }

      // Select category for category-specific challenges (before calculating reward difficulty)
      let targetCategory: string | undefined
      let categoryAdjustment = 0
      if (
        challengeTemplate.challengeType === 'category_similarity' ||
        challengeTemplate.challengeType === 'entry_count'
      ) {
        const categories = await getAvailableCategories({ payload } as PayloadRequest)
        if (categories.length > 0) {
          const randomCategory = categories[Math.floor(Math.random() * categories.length)]
          targetCategory = randomCategory.category
          categoryAdjustment = randomCategory.difficultyAdjustment || 0
        }
      }

      // Get reward difficulty with category adjustment
      let rewardDifficulty = getRandomRewardDifficulty('weekly')
      if (categoryAdjustment > 0) {
        rewardDifficulty = Math.min(9, rewardDifficulty + categoryAdjustment)
      }

      // Get a random reward for the difficulty level
      const availableRewards = rewards.docs.filter((r: Reward) => r.difficulty === rewardDifficulty)

      if (availableRewards.length === 0) {
        console.warn(`No rewards found for difficulty ${rewardDifficulty}`)
        continue
      }

      const randomReward = availableRewards[Math.floor(Math.random() * availableRewards.length)]

      // Generate title and description dynamically
      const title = generateTitle(
        challengeTemplate.challengeType,
        targetValue,
        'weekly',
        targetCategory,
      )
      const description = generateDescription(
        challengeTemplate.challengeType,
        targetValue,
        'weekly',
        targetCategory,
      )

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
          title,
          description,
          challengeType: challengeTemplate.challengeType,
          targetValue,
          targetCategory,
          rewardDifficulty,
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
      { status: 500 },
    )
  }
}
