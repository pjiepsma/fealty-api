import { getPayload } from 'payload'
import config from '@payload-config'
import type { Session } from '@/payload-types'

export async function runCalculateKingStatus(): Promise<{ success: boolean; processedCount: number; updatedCount: number; timestamp: string; message: string }> {
  const timestamp = new Date().toISOString()
  console.log(`[TASK] 👑 King status calculation started at ${timestamp}`)

  try {
    const payload = await getPayload({ config })

    // Get all POIs
    const pois = await payload.find({
      collection: 'pois',
      limit: 10000,
    })

    let processedCount = 0
    let updatedCount = 0

    for (const poi of pois.docs) {
      try {
        // Get all sessions for this POI
        const sessions = await payload.find({
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
            await payload.update({
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

        // Update POI if king changed
        const currentKingId = typeof poi.currentKing === 'string' ? poi.currentKing : poi.currentKing?.id
        if (kingUserId && kingUserId !== currentKingId) {
          await payload.update({
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

    // Update user currentKingOf counts
    const users = await payload.find({
      collection: 'users',
      limit: 10000,
    })

    for (const user of users.docs) {
      try {
        const kingOfCount = await payload.find({
          collection: 'pois',
          where: {
            currentKing: {
              equals: user.id,
            },
          },
          limit: 1,
        })

        const currentCount = user.currentKingOf || 0
        const actualCount = kingOfCount.totalDocs

        if (currentCount !== actualCount) {
          await payload.update({
            collection: 'users',
            id: user.id,
            data: {
              currentKingOf: actualCount,
            },
          })
        }
      } catch (error) {
        console.error(`Error updating king count for user ${user.id}:`, error)
      }
    }

    console.log(`✅ [TASK] King status calculation completed: ${processedCount} POIs processed, ${updatedCount} kings updated`)

    return {
      success: true,
      processedCount,
      updatedCount,
      timestamp,
      message: `${processedCount} POIs processed, ${updatedCount} kings updated`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [TASK] Error in king status calculation:', errorMessage)
    throw error
  }
}
