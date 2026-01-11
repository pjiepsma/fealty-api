import type { CollectionConfig, PayloadRequest } from 'payload'
import type { Session, Challenge, Pois, Reward } from '@/payload-types'
import { RewardService } from '@/services/rewardService'

// Default daily seconds limit (fallback when game config is not available)

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  admin: {
    useAsTitle: 'id',
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        // Early return if data is not provided
        if (!data) {
          return data
        }
        
        if (data.user && data.poi && data.startTime && data.secondsEarned) {
          try {
            const gameConfig = await req.payload.findGlobal({
              slug: 'game-config',
            })

            type GameConfigType = { dailySecondsLimit?: number }
            const typedConfig = gameConfig as GameConfigType

            if (typeof typedConfig.dailySecondsLimit !== 'number') {
              throw new Error('Game config missing required field: dailySecondsLimit')
            }

            const dailySecondsLimit = typedConfig.dailySecondsLimit
            
            const userId = typeof data.user === 'string' ? data.user : data.user?.id
            const poiId = typeof data.poi === 'string' ? data.poi : data.poi?.id

            if (!userId || !poiId) {
              return data
            }

            // Get start of day for the session
            const sessionDate = new Date(data.startTime)
            sessionDate.setHours(0, 0, 0, 0)

            const todaySessions = await req.payload.find({
              collection: 'sessions',
              where: {
                and: [
                  {
                    user: {
                      equals: userId,
                    },
                  },
                  {
                    poi: {
                      equals: poiId,
                    },
                  },
                  {
                    startTime: {
                      greater_than_equal: sessionDate.toISOString(),
                    },
                  },
                  {
                    startTime: {
                      less_than: new Date(sessionDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                    },
                  },
                ],
              },
              limit: 100,
            })

            // Calculate total seconds earned today at this POI
            const dailyTotal = todaySessions.docs.reduce((sum: number, session: Session) => {
              return sum + (session.secondsEarned || 0)
            }, 0)

            const requestedSeconds = typeof data.secondsEarned === 'number' ? data.secondsEarned : 0

            if (dailyTotal + requestedSeconds > dailySecondsLimit) {
              const remainingSeconds = dailySecondsLimit - dailyTotal
              
              if (remainingSeconds <= 0) {
                throw new Error(
                  `Daily limit reached for this POI. You have already earned ${dailyTotal} seconds today (max: ${dailySecondsLimit} seconds).`
                )
              }

              data.secondsEarned = Math.max(0, remainingSeconds)
              console.log(
                `Capping session seconds: ${requestedSeconds}s → ${data.secondsEarned}s (${dailyTotal}s already earned today, limit: ${dailySecondsLimit}s)`
              )
            }
          } catch (error) {
            // If it's our validation error, throw it
            if (error instanceof Error && error.message.includes('Daily limit')) {
              throw error
            }
            // Otherwise log and continue (don't block session creation)
            console.error('Error validating daily limit:', error)
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create' && doc.user && doc.secondsEarned) {
          try {
            const userId = typeof doc.user === 'string' ? doc.user : doc.user.id

            // Get current user stats
            const user = await req.payload.findByID({
              collection: 'users',
              id: userId,
            })

            // Calculate new stats
            const totalSeconds = (user.totalSeconds || 0) + doc.secondsEarned

            // Count unique POIs claimed by this user
            const userSessions = await req.payload.find({
              collection: 'sessions',
              where: {
                user: {
                  equals: userId,
                },
              },
              limit: 1000,
            })

            const uniquePOIs = new Set(
              userSessions.docs.map((session: Session) => {
                const poiId = typeof session.poi === 'string' ? session.poi : session.poi?.id
                return poiId
              }),
            )

            const totalPOIsClaimed = uniquePOIs.size

            // Update user stats
            await req.payload.update({
              collection: 'users',
              id: userId,
              data: {
                totalSeconds,
                totalPOIsClaimed,
                lastActive: new Date().toISOString(),
              },
            })

            // Update challenge progress
            await updateChallengeProgress(req, userId, doc)

            // TODO: Calculate streaks (requires checking previous sessions)
            // TODO: Calculate currentKingOf (requires checking all POIs)
          } catch (error) {
            console.error('Error updating user stats after session:', error)
            // Don't throw error to prevent session creation from failing
          }
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User who made this session',
      },
    },
    {
      name: 'poi',
      type: 'relationship',
      relationTo: 'pois',
      required: true,
      admin: {
        description: 'POI where the session took place',
      },
    },
    {
      name: 'startTime',
      type: 'date',
      required: true,
      admin: {
        description: 'When the session started',
      },
    },
    {
      name: 'endTime',
      type: 'date',
      admin: {
        description: 'When the session ended',
      },
    },
    {
      name: 'secondsEarned',
      type: 'number',
      required: true,
      admin: {
        description: 'Seconds earned from this session',
      },
      validate: (value: number | number[] | null | undefined) => {
        if (typeof value === 'number' && value <= 0) {
          return 'Seconds earned must be greater than 0'
        }
        return true
      },
    },
    {
      name: 'month',
      type: 'text',
      required: true,
      admin: {
        description: 'Month in YYYY-MM format for leaderboard grouping',
      },
      validate: (value: string | string[] | null | undefined) => {
        if (typeof value === 'string' && !/^\d{4}-\d{2}$/.test(value)) {
          return 'Month must be in YYYY-MM format'
        }
        return true
      },
    },
  ],
  timestamps: true,
  indexes: [
    {
      fields: ['user'],
    },
    {
      fields: ['poi'],
    },
    {
      fields: ['month'],
    },
    {
      fields: ['user', 'poi', 'month'],
    },
  ],
}

/**
 * Update challenge progress based on the newly created session
 */
async function updateChallengeProgress(req: PayloadRequest, userId: string, session: Session) {
  try {
    const poiId = typeof session.poi === 'string' ? session.poi : session.poi?.id
    const secondsEarned = session.secondsEarned || 0
    const now = new Date()

    // Get all non-completed challenges for this user
    // Check all challenges regardless of expiration - if user completes the requirement, mark it as completed
    const activeChallenges = await req.payload.find({
      collection: 'challenges',
      where: {
        and: [
          {
            user: {
              equals: userId,
            },
          },
          {
            completedAt: {
              equals: null,
            },
          },
        ],
      },
      limit: 100,
    })

    if (activeChallenges.docs.length === 0) {
      return
    }

    // Get POI details if needed
    let poi: Pois | null = null
    if (poiId) {
      try {
        poi = await req.payload.findByID({
          collection: 'pois',
          id: poiId,
        }) as Pois
      } catch (error) {
        console.error(`Error fetching POI ${poiId}:`, error)
      }
    }

    // Process each challenge
    for (const challenge of activeChallenges.docs as Challenge[]) {
      try {
        let newProgress = challenge.progress || 0
        let shouldUpdate = false

        switch (challenge.challengeType) {
          case 'longest_session':
            // Update progress to the maximum of current progress and this session's duration
            if (secondsEarned > newProgress) {
              newProgress = secondsEarned
              shouldUpdate = true
            }
            break

          case 'session_duration':
            // Add this session's duration to progress
            newProgress += secondsEarned
            shouldUpdate = true
            break

          case 'entry_count':
            // Increment progress by 1
            newProgress += 1
            shouldUpdate = true
            break

          case 'unique_pois':
            // Count unique POIs (reuse logic from user stats)
            if (poiId) {
              const userSessions = await req.payload.find({
                collection: 'sessions',
                where: {
                  user: {
                    equals: userId,
                  },
                },
                limit: 1000,
              })

              const uniquePOIs = new Set(
                userSessions.docs.map((s: Session) => {
                  const id = typeof s.poi === 'string' ? s.poi : s.poi?.id
                  return id
                }),
              )

              newProgress = uniquePOIs.size
              shouldUpdate = true
            }
            break

          case 'crown_claim':
            // Check if user is king of this POI
            if (poi && poi.currentKing) {
              const kingId = typeof poi.currentKing === 'string' ? poi.currentKing : poi.currentKing?.id
              if (kingId === userId) {
                newProgress += 1
                shouldUpdate = true
              }
            }
            break

          case 'category_variety':
            // Count unique categories visited
            if (poi) {
              const userSessions = await req.payload.find({
                collection: 'sessions',
                where: {
                  user: {
                    equals: userId,
                  },
                },
                limit: 1000,
                depth: 1,
              })

              const uniqueCategories = new Set<string>()
              for (const s of userSessions.docs as Session[]) {
                const poiData = typeof s.poi === 'string' ? null : s.poi
                if (poiData && poiData.category) {
                  uniqueCategories.add(poiData.category)
                }
              }

              newProgress = uniqueCategories.size
              shouldUpdate = true
            }
            break

          case 'category_similarity':
            // Count sessions in the same category as targetCategory
            if (challenge.targetCategory && poi && poi.category === challenge.targetCategory) {
              const userSessions = await req.payload.find({
                collection: 'sessions',
                where: {
                  and: [
                    {
                      user: {
                        equals: userId,
                      },
                    },
                    {
                      poi: {
                        equals: poiId,
                      },
                    },
                  ],
                },
                limit: 1000,
              })

              newProgress = userSessions.totalDocs
              shouldUpdate = true
            }
            break

          case 'new_location':
            // Check if this is a new POI for the user
            if (poiId) {
              const previousSessions = await req.payload.find({
                collection: 'sessions',
                where: {
                  and: [
                    {
                      user: {
                        equals: userId,
                      },
                    },
                    {
                      poi: {
                        equals: poiId,
                      },
                    },
                    {
                      id: {
                        not_equals: session.id,
                      },
                    },
                  ],
                },
                limit: 1,
              })

              // If no previous sessions at this POI, this is a new location
              if (previousSessions.totalDocs === 0) {
                newProgress += 1
                shouldUpdate = true
              }
            }
            break
        }

        // Update challenge progress if it changed
        if (shouldUpdate) {
          const updateData: {
            progress: number
            completedAt?: string
          } = {
            progress: newProgress,
          }

          // Check if challenge is completed
          const targetValue = challenge.targetValue || 0
          if (newProgress >= targetValue && !challenge.completedAt) {
            updateData.completedAt = now.toISOString()

            // Activate reward
            const reward = challenge.reward
            if (reward) {
              const rewardData: Reward = typeof reward === 'string'
                ? (await req.payload.findByID({
                    collection: 'rewards',
                    id: reward,
                  }) as Reward)
                : (reward as Reward)

              if (rewardData) {
                await RewardService.activateReward(
                  req.payload,
                  userId,
                  rewardData,
                  challenge.id,
                )
              }
            }
          }

          await req.payload.update({
            collection: 'challenges',
            id: challenge.id,
            data: updateData,
          })
        }
      } catch (error) {
        console.error(`Error updating challenge ${challenge.id}:`, error)
        // Continue with other challenges
      }
    }
  } catch (error) {
    console.error('Error updating challenge progress:', error)
    // Don't throw error to prevent session creation from failing
  }
}






