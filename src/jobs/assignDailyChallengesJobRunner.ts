import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Get or create a coin reward for the given difficulty
 * Coin reward gives coins equal to the difficulty level
 */
async function getOrCreateCoinReward(payload: Awaited<ReturnType<typeof getPayload>>, difficulty: number) {
  // Try to find existing coin reward for this difficulty
  const existingRewards = await payload.find({
    collection: 'rewards',
    where: {
      and: [
        { difficulty: { equals: difficulty } },
        { rewardType: { equals: 'coins' } },
      ],
    },
    limit: 1,
  })

  if (existingRewards.docs.length > 0) {
    return existingRewards.docs[0]
  }

  // Create new coin reward for this difficulty
  const coinReward = await payload.create({
    collection: 'rewards',
    data: {
      rewardType: 'coins',
      rewardValue: difficulty, // Coins equal to difficulty
      difficulty: difficulty,
      description: `${difficulty} coin reward`,
      isActive: true,
    },
  })

  console.log(`[TASK] Created coin reward for difficulty ${difficulty}`)
  return coinReward
}

/**
 * Standalone runner for assign daily challenges job
 * @description Can be called from API routes without Payload job context
 * Source: Adapted from Aaron Saunders' approach for serverless
 */
export const runAssignDailyChallenges = async () => {
  const timestamp = new Date().toISOString()
  console.log(`[TASK] 🎯 Daily challenges assignment started at ${timestamp}`)

  try {
    const payload = await getPayload({ config })

    // Get all active users
    const users = await payload.find({
      collection: 'users',
      limit: 10000,
    })

    let assignedCount = 0
    let errorCount = 0

    console.log(`[TASK] Found ${users.docs.length} users to process`)

    for (const user of users.docs) {
      try {
        // Check existing challenges for this user
        const existingChallenges = await payload.find({
          collection: 'challenges',
          where: {
            and: [
              {
                user: {
                  equals: user.id,
                },
              },
              {
                type: {
                  equals: 'daily',
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

        // Skip if user already has active daily challenges
        if (existingChallenges.docs.length > 0) {
          console.log(
            `[TASK] User ${user.id} already has ${existingChallenges.docs.length} active daily challenges, skipping`,
          )
          continue
        }

        // Generate challenges for user
        const { generateChallengesForUser } = await import('../services/challengeGenerator')
        const generatedChallenges = await generateChallengesForUser(
          { payload } as Awaited<ReturnType<typeof getPayload>> extends { payload: infer P } ? { payload: P } : never,
          user.id,
          'daily',
        )

        console.log(`[TASK] Generated ${generatedChallenges.length} challenges for user ${user.id}`)

        // Assign rewards and create challenges
        for (const challengeData of generatedChallenges) {
          try {
            // Get or create coin reward equal to difficulty
            const coinReward = await getOrCreateCoinReward(payload, challengeData.rewardDifficulty)

            // Create challenge
            await payload.create({
              collection: 'challenges',
              data: {
                user: user.id,
                type: challengeData.type,
                title: challengeData.title,
                description: challengeData.description,
                challengeType: challengeData.challengeType,
                targetValue: challengeData.targetValue,
                targetCategory: challengeData.targetCategory,
                rewardDifficulty: challengeData.rewardDifficulty,
                reward: coinReward.id,
                progress: 0,
                expiresAt: challengeData.expiresAt,
                cost: challengeData.cost,
              },
            })

            assignedCount++
          } catch (error) {
            console.error(`[TASK] Error creating challenge for user ${user.id}:`, error)
            errorCount++
          }
        }
      } catch (error) {
        console.error(`[TASK] Error processing user ${user.id}:`, error)
        errorCount++
      }
    }

    console.log(
      `✅ [TASK] Daily challenges assignment completed: Assigned ${assignedCount} challenges, ${errorCount} errors`,
    )

    return {
      output: {
        success: true,
        assignedCount,
        errorCount,
        timestamp,
        message: `Assigned ${assignedCount} daily challenges to users`,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [TASK] Error in daily challenges assignment:', errorMessage)
    throw error
  }
}

