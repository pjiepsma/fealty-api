import type { TaskConfig } from 'payload'
import type { Period } from '../config/challengeRules'
import { generateChallengesForUser, generateSharedChallenges } from '../services/challengeGenerator'

/**
 * Assign daily challenges (personal challenges for each user)
 */
async function assignDailyChallenges(req: any): Promise<{ assignedCount: number; errorCount: number }> {
  // Get all active users
  const users = await req.payload.find({
    collection: 'users',
    limit: 10000, // Process in batches if needed
  })

  let assignedCount = 0
  let errorCount = 0

  for (const user of users.docs) {
    try {
      // Check existing challenges for this user
      const existingChallenges = await req.payload.find({
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
        console.log(`User ${user.id} already has ${existingChallenges.docs.length} active daily challenges, skipping`)
        continue
      }

      // Generate challenges for user
      const generatedChallenges = await generateChallengesForUser(req, user.id, 'daily')

      // Assign rewards and create challenges
      for (const challengeData of generatedChallenges) {
        try {
          // Get random reward for the difficulty
          const rewards = await req.payload.find({
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
              `No active rewards found for difficulty ${challengeData.rewardDifficulty}, skipping challenge`
            )
            continue
          }

          // Pick random reward
          const randomReward = rewards.docs[Math.floor(Math.random() * rewards.docs.length)]

          // Create challenge
          await req.payload.create({
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
              isPersonal: challengeData.isPersonal,
              cost: challengeData.cost,
            },
          })

          assignedCount++
        } catch (error) {
          console.error(`Error creating challenge for user ${user.id}:`, error)
          errorCount++
        }
      }
    } catch (error) {
      console.error(`Error processing user ${user.id}:`, error)
      errorCount++
    }
  }

  return { assignedCount, errorCount }
}

/**
 * Assign shared challenges for weekly/monthly periods
 */
async function assignSharedChallengesForPeriod(req: any, period: Period): Promise<{ assignedCount: number; errorCount: number }> {
  // Check if challenges already exist for this period
  const existingChallenges = await req.payload.find({
    collection: 'challenges',
    where: {
      and: [
        {
          type: {
            equals: period,
          },
        },
        {
          expiresAt: {
            greater_than: new Date().toISOString(),
          },
        },
      ],
    },
    limit: 1,
  })

  if (existingChallenges.docs.length > 0) {
    console.log(`Shared ${period} challenges already exist, skipping`)
    return { assignedCount: 0, errorCount: 0 }
  }

  // Generate shared challenges
  const generatedChallenges = await generateSharedChallenges(req, period)

  // Get all users
  const users = await req.payload.find({
    collection: 'users',
    limit: 10000,
  })

  let assignedCount = 0
  let errorCount = 0

  // Assign each challenge to all users
  for (const challengeData of generatedChallenges) {
    try {
      // Get random reward for the difficulty
      const rewards = await req.payload.find({
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
          `No active rewards found for difficulty ${challengeData.rewardDifficulty}, skipping challenge`
        )
        continue
      }

      // Pick random reward
      const randomReward = rewards.docs[Math.floor(Math.random() * rewards.docs.length)]

      // Assign to all users
      for (const user of users.docs) {
        try {
          await req.payload.create({
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
              isPersonal: challengeData.isPersonal,
              cost: challengeData.cost,
            },
          })

          assignedCount++
        } catch (error) {
          console.error(`Error creating challenge for user ${user.id}:`, error)
          errorCount++
        }
      }
    } catch (error) {
      console.error(`Error processing challenge:`, error)
      errorCount++
    }
  }

  return { assignedCount, errorCount }
}

export const assignDailyChallengesTask: TaskConfig = {
  slug: 'assign-daily-challenges',
  handler: async (args) => {
    const { req } = args
    try {
      const { assignedCount, errorCount } = await assignDailyChallenges(req)
      console.log(
        `Daily challenges assignment completed: Assigned ${assignedCount} challenges, ${errorCount} errors`
      )
      return {
        output: {
          success: true,
          assignedCount,
          errorCount,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error in assignDailyChallenges:', errorMessage)
      return {
        state: 'failed' as const,
        errorMessage,
      }
    }
  },
}

export const assignWeeklyChallengesTask: TaskConfig = {
  slug: 'assign-weekly-challenges',
  handler: async (args) => {
    const { req } = args
    try {
      const { assignedCount, errorCount } = await assignSharedChallengesForPeriod(req, 'weekly')
      console.log(
        `Weekly challenges assignment completed: Assigned ${assignedCount} challenges, ${errorCount} errors`
      )
      return {
        output: {
          success: true,
          assignedCount,
          errorCount,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error in assignWeeklyChallenges:', errorMessage)
      return {
        state: 'failed' as const,
        errorMessage,
      }
    }
  },
}

export const assignMonthlyChallengesTask: TaskConfig = {
  slug: 'assign-monthly-challenges',
  handler: async (args) => {
    const { req } = args
    try {
      const { assignedCount, errorCount } = await assignSharedChallengesForPeriod(req, 'monthly')
      console.log(
        `Monthly challenges assignment completed: Assigned ${assignedCount} challenges, ${errorCount} errors`
      )
      return {
        output: {
          success: true,
          assignedCount,
          errorCount,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error in assignMonthlyChallenges:', errorMessage)
      return {
        state: 'failed' as const,
        errorMessage,
      }
    }
  },
}
