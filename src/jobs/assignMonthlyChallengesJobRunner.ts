import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Get or create a coin reward for the given difficulty
 * Coin reward gives coins equal to the difficulty level
 */
async function getOrCreateCoinReward(
  payload: Awaited<ReturnType<typeof getPayload>>,
  difficulty: number,
) {
  // Try to find existing coin reward for this difficulty
  const existingRewards = await payload.find({
    collection: 'rewards',
    where: {
      and: [{ difficulty: { equals: difficulty } }, { rewardType: { equals: 'coins' } }],
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
 * Standalone runner for assign monthly challenges job
 * @description Can be called from API routes without Payload job context
 */
export const runAssignMonthlyChallenges = async () => {
  const timestamp = new Date().toISOString()
  console.log(`[TASK] 📆 Monthly challenges assignment started at ${timestamp}`)

  try {
    const payload = await getPayload({ config })

    const users = await payload.find({
      collection: 'users',
      limit: 10000,
    })

    let assignedCount = 0
    let errorCount = 0

    console.log(`[TASK] Found ${users.docs.length} users to process for monthly challenges`)

    for (const user of users.docs) {
      try {
        // Check existing monthly challenges for this user
        const existingChallenges = await payload.find({
          collection: 'challenges',
          where: {
            and: [
              { user: { equals: user.id } },
              { type: { equals: 'monthly' } },
              { expiresAt: { greater_than: new Date().toISOString() } },
            ],
          },
          limit: 100,
        })

        if (existingChallenges.docs.length > 0) {
          console.log(`[TASK] User ${user.id} already has active monthly challenges, skipping`)
          continue
        }

        const { generateChallengesForUser } = await import('../services/challengeGenerator')
        const generatedChallenges = await generateChallengesForUser(
          { payload } as Awaited<ReturnType<typeof getPayload>> extends { payload: infer P }
            ? { payload: P }
            : never,
          user.id,
          'monthly',
        )

        console.log(
          `[TASK] Generated ${generatedChallenges.length} monthly challenges for user ${user.id}`,
        )

        for (const challengeData of generatedChallenges) {
          try {
            // Get or create coin reward equal to difficulty
            const coinReward = await getOrCreateCoinReward(payload, challengeData.rewardDifficulty)

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
            console.error(`[TASK] Error creating monthly challenge for user ${user.id}:`, error)
            errorCount++
          }
        }
      } catch (error) {
        console.error(`[TASK] Error processing user ${user.id}:`, error)
        errorCount++
      }
    }

    console.log(
      `✅ [TASK] Monthly challenges assignment completed: ${assignedCount} assigned, ${errorCount} errors`,
    )

    return {
      output: {
        success: true,
        assignedCount,
        errorCount,
        timestamp,
        message: `Assigned ${assignedCount} monthly challenges`,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [TASK] Error in monthly challenges assignment:', errorMessage)
    throw error
  }
}
