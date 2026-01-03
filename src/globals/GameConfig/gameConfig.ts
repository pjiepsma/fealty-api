import type { GlobalConfig } from 'payload'

export const GameConfig: GlobalConfig = {
  slug: 'game-config',
  admin: {
    description: 'Core game mechanics and balance configuration',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Session Limits',
          fields: [
            {
              name: 'dailySecondsLimit',
              type: 'number',
              required: true,
              defaultValue: 60,
              admin: {
                description: 'Maximum seconds a user can earn per POI per day',
              },
              validate: (value: number | number[] | null | undefined) => {
                if (typeof value === 'number') {
                  if (value <= 0) {
                    return 'Daily seconds limit must be greater than 0'
                  }
                  if (value > 3600) {
                    return 'Daily seconds limit cannot exceed 3600 (1 hour)'
                  }
                }
                return true
              },
            },
          ],
        },
        {
          label: 'Game Mechanics',
          fields: [
            {
              name: 'entryDuration',
              type: 'number',
              required: true,
              defaultValue: 60,
              admin: {
                description: 'Entry mode duration in seconds (before capture starts for normal users)',
              },
              validate: (value: number | number[] | null | undefined) => {
                if (typeof value === 'number' && (value < 10 || value > 300)) {
                  return 'Entry duration must be between 10 and 300 seconds'
                }
                return true
              },
            },
            {
              name: 'kingEntryDuration',
              type: 'number',
              required: true,
              defaultValue: 25,
              admin: {
                description: 'Entry mode duration in seconds for POI kings (reduced time)',
              },
              validate: (value: number | number[] | null | undefined) => {
                if (typeof value === 'number' && (value < 5 || value > 120)) {
                  return 'King entry duration must be between 5 and 120 seconds'
                }
                return true
              },
            },
            {
              name: 'poiRadius',
              type: 'number',
              required: true,
              defaultValue: 220,
              admin: {
                description: 'Detection radius around POI in meters',
              },
              validate: (value: number | number[] | null | undefined) => {
                if (typeof value === 'number' && (value < 50 || value > 1000)) {
                  return 'POI radius must be between 50 and 1000 meters'
                }
                return true
              },
            },
            {
              name: 'maxCaptureSeconds',
              type: 'number',
              required: true,
              defaultValue: 60,
              admin: {
                description: 'Maximum seconds per capture session',
              },
              validate: (value: number | number[] | null | undefined) => {
                if (typeof value === 'number' && (value < 30 || value > 600)) {
                  return 'Max capture seconds must be between 30 and 600 seconds'
                }
                return true
              },
            },
          ],
        },
        {
          label: 'Reward System',
          fields: [
            {
              name: 'minuteBonusSeconds',
              type: 'number',
              required: true,
              defaultValue: 10,
              admin: {
                description: 'Bonus seconds awarded for completing a full minute (60s + bonus = total)',
              },
              validate: (value: number | number[] | null | undefined) => {
                if (typeof value === 'number' && (value < 0 || value > 60)) {
                  return 'Minute bonus seconds must be between 0 and 60'
                }
                return true
              },
            },
          ],
        },
        {
          label: 'Decay System',
          fields: [
            {
              name: 'defaultDecayPercentage',
              type: 'number',
              required: true,
              defaultValue: 5,
              admin: {
                description: 'Default daily decay percentage applied to user totalSeconds',
              },
              validate: (value: number | number[] | null | undefined) => {
                if (typeof value === 'number' && (value < 0 || value > 20)) {
                  return 'Default decay percentage must be between 0 and 20%'
                }
                return true
              },
            },
            {
              name: 'maxDecayReduction',
              type: 'number',
              required: true,
              defaultValue: 3,
              admin: {
                description: 'Maximum decay reduction percentage (minimum decay = default - max)',
              },
              validate: (value: number | number[] | null | undefined) => {
                if (typeof value === 'number' && (value < 0 || value > 10)) {
                  return 'Max decay reduction must be between 0 and 10%'
                }
                return true
              },
            },
          ],
        },
      ],
    },
  ],
}

