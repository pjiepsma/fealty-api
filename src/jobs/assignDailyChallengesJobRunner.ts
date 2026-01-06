import { getPayload } from 'payload'
import config from '@payload-config'

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
          { payload } as any,
          user.id,
          'daily',
        )

        console.log(`[TASK] Generated ${generatedChallenges.length} challenges for user ${user.id}`)

        // Assign rewards and create challenges
        for (const challengeData of generatedChallenges) {
          try {
            // Get random reward for the difficulty
            const rewards = await payload.find({
              collection: 'rewards',
              where: {
                and: [
                  {
                    difficulty: {
                      equals: challengeData.rewardDifficulty,
                    },
                  },
                  {
                    isActive: {
                      equals: true,
                    },
                  },
                ],
              },
              limit: 100,
            })

            if (rewards.docs.length === 0) {
              console.warn(
                `[TASK] No active rewards found for difficulty ${challengeData.rewardDifficulty}, skipping challenge`,
              )
              continue
            }

            // Pick random reward
            const randomReward = rewards.docs[Math.floor(Math.random() * rewards.docs.length)]

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
                reward: randomReward.id,
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

