import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const poiId = searchParams.get('poiId')
    const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7) // YYYY-MM

    if (!poiId) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: poiId',
        },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Get all sessions for this POI in the specified month
    const sessions = await payload.find({
      collection: 'sessions',
      where: {
        and: [
          {
            poi: {
              equals: poiId,
            },
          },
          {
            month: {
              equals: month,
            },
          },
        ],
      },
      limit: 1000,
      depth: 1, // Include user relationship
    })

    // Group by user and sum seconds
    const userStats = new Map<string, { userId: string; username: string; seconds: number }>()

    for (const session of sessions.docs) {
      const userId = typeof session.user === 'string' ? session.user : session.user?.id
      const user = typeof session.user === 'object' ? session.user : null
      const username = user?.username ?? user?.email ?? 'Unknown'

      if (userId) {
        const existing = userStats.get(userId)
        if (existing) {
          existing.seconds += session.secondsEarned ?? 0
        } else {
          userStats.set(userId, {
            userId,
            username,
            seconds: session.secondsEarned ?? 0,
          })
        }
      }
    }

    // Convert to array and sort by seconds (descending)
    const leaderboard = Array.from(userStats.values())
      .map((stat, index) => ({
        ...stat,
        minutes: Math.floor(stat.seconds / 60),
        rank: index + 1,
      }))
      .sort((a, b) => b.seconds - a.seconds)
      .map((stat, index) => ({
        ...stat,
        rank: index + 1,
      }))
      .slice(0, 100) // Top 100

    return NextResponse.json({
      poiId,
      month,
      leaderboard,
    })
  } catch (error) {
    console.error('Error fetching POI leaderboard:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch POI leaderboard',
      },
      { status: 500 }
    )
  }
}

