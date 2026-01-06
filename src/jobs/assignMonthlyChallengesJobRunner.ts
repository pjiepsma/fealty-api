import { getPayload } from 'payload'
import config from '@payload-config'

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
          { payload } as any,
          user.id,
          'monthly',
        )

        console.log(`[TASK] Generated ${generatedChallenges.length} monthly challenges for user ${user.id}`)

        for (const challengeData of generatedChallenges) {
          try {
            const rewards = await payload.find({
              collection: 'rewards',
              where: {
                and: [
                  { difficulty: { equals: challengeData.rewardDifficulty } },
                  { isActive: { equals: true } },
                ],
              },
              limit: 100,
            })

            if (rewards.docs.length === 0) {
              console.warn(`[TASK] No active rewards found for difficulty ${challengeData.rewardDifficulty}`)
              continue
            }

            const randomReward = rewards.docs[Math.floor(Math.random() * rewards.docs.length)]

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
            console.error(`[TASK] Error creating monthly challenge for user ${user.id}:`, error)
            errorCount++
          }
        }
      } catch (error) {
        console.error(`[TASK] Error processing user ${user.id}:`, error)
        errorCount++
      }
    }

    console.log(`✅ [TASK] Monthly challenges assignment completed: ${assignedCount} assigned, ${errorCount} errors`)

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

