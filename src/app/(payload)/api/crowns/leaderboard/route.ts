import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import type { Session } from '@/payload-types'

export async function GET(_request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Get all POIs
    const pois = await payload.find({
      collection: 'pois',
      limit: 10000,
    })

    // For each POI, find the current month's king (user with most seconds)
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const userCrowns = new Map<string, { userId: string; username: string; crowns: number }>()

    for (const poi of pois.docs) {
      // Get sessions for this POI in current month
      const sessions = await payload.find({
        collection: 'sessions',
        where: {
          and: [
            {
              poi: {
                equals: poi.id,
              },
            },
            {
              month: {
                equals: currentMonth,
              },
            },
          ],
        },
        limit: 1000,
        depth: 1,
      })

      // Group by user and sum seconds
      const userStats = new Map<string, number>()
      for (const session of sessions.docs) {
        const userId = typeof session.user === 'string' ? session.user : session.user?.id
        if (userId) {
          const existing = userStats.get(userId) ?? 0
          userStats.set(userId, existing + (session.secondsEarned ?? 0))
        }
      }

      // Find the king (user with most seconds)
      if (userStats.size > 0) {
        const king = Array.from(userStats.entries()).sort((a, b) => b[1] - a[1])[0]
        const kingUserId = king[0]

        // Get user details
        const kingSession = sessions.docs.find((s: Session) => {
          const userId = typeof s.user === 'string' ? s.user : s.user?.id
          return userId === kingUserId
        })

        if (kingSession) {
          const user = typeof kingSession.user === 'object' ? kingSession.user : null
          const username = user?.username ?? user?.email ?? 'Unknown'

          const existing = userCrowns.get(kingUserId)
          if (existing) {
            existing.crowns += 1
          } else {
            userCrowns.set(kingUserId, {
              userId: kingUserId,
              username,
              crowns: 1,
            })
          }
        }
      }
    }

    // Convert to array and sort by crowns (descending)
    const leaderboard = Array.from(userCrowns.values())
      .sort((a, b) => b.crowns - a.crowns)
      .map((stat, index) => ({
        ...stat,
        rank: index + 1,
      }))
      .slice(0, 100) // Top 100

    return NextResponse.json({
      leaderboard,
    })
  } catch (error) {
    console.error('Error fetching crown leaderboard:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch crown leaderboard',
      },
      { status: 500 }
    )
  }
}

