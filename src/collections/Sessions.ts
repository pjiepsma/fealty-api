import type { CollectionConfig } from 'payload'

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  admin: {
    useAsTitle: 'id',
  },
  access: {
    read: () => true, // Public read for leaderboards
    create: ({ req: { user } }) => {
      if (!user) return false
      // Users can only create their own sessions
      return true
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      // Admins can update any session
      if (user.role === 'admin') return true
      // Users cannot update sessions (they are immutable)
      return false
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      // Only admins can delete sessions
      return user.role === 'admin'
    },
  },
  hooks: {
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
              userSessions.docs.map((session: any) => {
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




