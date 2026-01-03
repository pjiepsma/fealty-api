import type { CollectionConfig } from 'payload'
import { generateMail } from '@/globals/Mail/utilities/sendMail'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 3, // 3 days (same as de-aandachtgevers)
    forgotPassword: {
      generateEmailHTML: async (args) => {
        if (!args || !args.req || !args.token) {
          return ''
        }

        const { body } = await generateMail({
          type: 'forgotPassword',
          placeholders: {
            token: args.token,
            origin:
              process.env.PAYLOAD_PUBLIC_APP_DEEP_LINK ||
              process.env.PAYLOAD_PUBLIC_SERVER_URL ||
              process.env.PAYLOAD_SERVER_URL ||
              '',
          },
          req: args.req,
        })

        return body
      },
      generateEmailSubject: async (args) => {
        if (!args || !args.req || !args.token) {
          return ''
        }

        const { subject } = await generateMail({
          type: 'forgotPassword',
          placeholders: {
            token: args.token,
            origin:
              process.env.PAYLOAD_PUBLIC_APP_DEEP_LINK ||
              process.env.PAYLOAD_PUBLIC_SERVER_URL ||
              process.env.PAYLOAD_SERVER_URL ||
              '',
          },
          req: args.req,
        })

        return subject
      },
    },
  },
  hooks: {
    afterChange: [
      async ({ doc }) => {
        // Update user stats when claims are created (handled in Claims collection)
        // This hook can be used for other post-update operations
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'username',
      type: 'text',
      unique: true,
      required: true,
      admin: {
        description: 'Unique username for the user',
      },
    },
    {
      name: 'isPremium',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the user has premium subscription',
      },
    },
    {
      name: 'totalSeconds',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Total seconds earned from all claims',
        readOnly: true,
      },
    },
    {
      name: 'totalPOIsClaimed',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Total number of unique POIs claimed',
        readOnly: true,
      },
    },
    {
      name: 'currentKingOf',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of POIs where user is currently the king',
        readOnly: true,
      },
    },
    {
      name: 'longestStreak',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Longest streak of consecutive days with claims',
        readOnly: true,
      },
    },
    {
      name: 'currentStreak',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Current streak of consecutive days with claims',
        readOnly: true,
      },
    },
    {
      name: 'lastActive',
      type: 'date',
      admin: {
        description: 'Last time user was active',
        readOnly: true,
      },
    },
    {
      name: 'homeCountry',
      type: 'text',
      admin: {
        description: 'User home country',
      },
    },
    {
      name: 'homeCity',
      type: 'text',
      admin: {
        description: 'User home city',
      },
    },
    {
      name: 'homeCityLat',
      type: 'number',
      admin: {
        description: 'Home city latitude',
      },
    },
    {
      name: 'homeCityLng',
      type: 'number',
      admin: {
        description: 'Home city longitude',
      },
    },
    {
      name: 'locationUpdatedAt',
      type: 'date',
      admin: {
        description: 'When location was last updated',
        readOnly: true,
      },
    },
    {
      name: 'locationUpdateCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of times location has been updated',
        readOnly: true,
      },
    },
    {
      name: 'coins',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'User coins for purchasing challenge buyouts',
      },
    },
    {
      name: 'notificationSettings',
      type: 'group',
      admin: {
        description: 'User notification preferences',
      },
      fields: [
        {
          name: 'poiNearby',
          type: 'checkbox',
          defaultValue: true,
          label: 'POI Nearby',
        },
        {
          name: 'captureComplete',
          type: 'checkbox',
          defaultValue: true,
          label: 'Capture Complete',
        },
        {
          name: 'kingStatusChanged',
          type: 'checkbox',
          defaultValue: true,
          label: 'King Status Changed',
        },
        {
          name: 'newChallenge',
          type: 'checkbox',
          defaultValue: false,
          label: 'New Challenge',
        },
        {
          name: 'friendActivity',
          type: 'checkbox',
          defaultValue: true,
          label: 'Friend Activity',
        },
        {
          name: 'leaderboardUpdate',
          type: 'checkbox',
          defaultValue: false,
          label: 'Leaderboard Update',
        },
        {
          name: 'dailyReminder',
          type: 'checkbox',
          defaultValue: true,
          label: 'Daily Reminder',
        },
        {
          name: 'weeklyReport',
          type: 'checkbox',
          defaultValue: true,
          label: 'Weekly Report',
        },
      ],
    },
    {
      name: 'pushTokens',
      type: 'array',
      admin: {
        description: 'Push tokens for this user (supports multiple devices)',
        position: 'sidebar',
      },
      fields: [
        {
          name: 'expoPushToken',
          type: 'text',
          required: true,
          admin: {
            description: 'Expo push token',
          },
        },
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'iOS', value: 'ios' },
            { label: 'Android', value: 'android' },
          ],
          admin: {
            description: 'Platform of the device',
          },
        },
        {
          name: 'deviceId',
          type: 'text',
          admin: {
            description: 'Device identifier',
          },
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Whether this token is active',
          },
        },
        {
          name: 'updatedAt',
          type: 'date',
          admin: {
            description: 'When this token was last updated',
          },
        },
      ],
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
      ],
      defaultValue: 'user',
      required: true,
      saveToJWT: true, // Include in JWT for access control checks
      admin: {
        description: 'User role',
      },
    },
    {
      name: 'activeRewards',
      type: 'array',
      admin: {
        description: 'Active rewards for this user',
      },
      fields: [
        {
          name: 'reward',
          type: 'relationship',
          relationTo: 'rewards',
          required: true,
          admin: {
            description: 'The reward that is active',
          },
        },
        {
          name: 'rewardType',
          type: 'text',
          required: true,
          admin: {
            description: 'Denormalized reward type for speed',
          },
        },
        {
          name: 'rewardValue',
          type: 'number',
          required: true,
          admin: {
            description: 'Denormalized reward value for speed',
          },
        },
        {
          name: 'expiresAt',
          type: 'date',
          admin: {
            description: 'For time-based rewards, when it expires (null for season-based)',
          },
        },
        {
          name: 'season',
          type: 'text',
          admin: {
            description: 'YYYY-MM format, for season-based rewards like bonus_crowns',
          },
        },
        {
          name: 'usesRemaining',
          type: 'number',
          admin: {
            description:
              'For use-based rewards, number of uses remaining (null for unlimited or season-based)',
          },
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Whether this reward is currently active',
          },
        },
        {
          name: 'challengeId',
          type: 'text',
          admin: {
            description: 'ID of the challenge that granted this reward',
          },
        },
      ],
    },
  ],
  timestamps: true,
}
