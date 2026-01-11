<<<<<<< HEAD
import type { PayloadRequest } from 'payload'
import type { Session, User } from '@/payload-types'

export const calculateKingStatusTask = {
  slug: 'calculate-king-status',
  handler: async (args: { req: PayloadRequest }) => {
    const { req } = args
    try {
      // Get all POIs
      const pois = await req.payload.find({
        collection: 'pois',
        limit: 10000, // Process all POIs
      })

      let processedCount = 0
      let updatedCount = 0

      for (const poi of pois.docs) {
        try {
          // Get all sessions for this POI
          const sessions = await req.payload.find({
            collection: 'sessions',
            where: {
              poi: {
                equals: poi.id,
              },
            },
            limit: 10000,
          })

          if (sessions.docs.length === 0) {
            // No sessions for this POI, clear king status
            if (poi.currentKing) {
              await req.payload.update({
                collection: 'pois',
                id: poi.id,
                data: {
                  currentKing: null,
                },
              })
              updatedCount++
            }
            processedCount++
            continue
          }

          // Group by user and sum seconds
          const userSecondsMap = new Map<string, number>()
          
          sessions.docs.forEach((session: Session) => {
            const userId = typeof session.user === 'string' ? session.user : session.user?.id
            if (userId) {
              const current = userSecondsMap.get(userId) || 0
              userSecondsMap.set(userId, current + (session.secondsEarned || 0))
            }
          })

          // Find king (user with most seconds)
          let maxSeconds = 0
          let kingUserId: string | null = null
          
          userSecondsMap.forEach((seconds, userId) => {
            if (seconds > maxSeconds) {
              maxSeconds = seconds
              kingUserId = userId
            }
          })

          // Get current king
          const currentKingId = typeof poi.currentKing === 'string' 
            ? poi.currentKing 
            : poi.currentKing?.id

          // Update if king changed
          if (kingUserId !== currentKingId) {
            await req.payload.update({
              collection: 'pois',
              id: poi.id,
              data: {
                currentKing: kingUserId,
              },
            })
            updatedCount++
          }

          processedCount++
        } catch (error) {
          console.error(`Error processing POI ${poi.id}:`, error)
        }
      }

      // Also update user.currentKingOf count for all users
      const users = await req.payload.find({
        collection: 'users',
        limit: 10000,
      })

      for (const user of users.docs) {
        try {
          // Count POIs where this user is the king
          const kingPOIs = await req.payload.find({
            collection: 'pois',
            where: {
              currentKing: {
                equals: user.id,
              },
            },
            limit: 10000,
          })

          const currentKingOf = kingPOIs.totalDocs

          // Update user if count changed
          if ((user as User).currentKingOf !== currentKingOf) {
            await req.payload.update({
              collection: 'users',
              id: user.id,
              data: {
                currentKingOf,
              },
            })
          }
        } catch (error) {
          console.error(`Error updating currentKingOf for user ${user.id}:`, error)
        }
      }

      console.log(
        `Calculate king status completed: Processed ${processedCount} POIs, updated ${updatedCount} POIs`
      )
      return {
        output: {
          success: true,
          processedCount,
          updatedCount,
        },
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error in calculateKingStatusTask:', errorMessage)
      return {
        state: 'failed' as const,
        errorMessage,
      }
    }
  },
}



=======
 
>>>>>>> b331cb0b5995a1c81e5d01eca51f795f5c1f445a
