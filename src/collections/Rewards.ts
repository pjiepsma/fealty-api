import type { CollectionConfig } from 'payload'

export const Rewards: CollectionConfig = {
  slug: 'rewards',
  admin: {
    useAsTitle: 'description',
  },
  fields: [
    {
      name: 'rewardType',
      type: 'select',
      required: true,
      options: [
        { label: 'Entry Time Reduction', value: 'entry_time_reduction' },
        { label: 'Bonus Seconds', value: 'bonus_seconds' },
        { label: 'Larger Radius', value: 'larger_radius' },
        { label: 'Extended Capture', value: 'extended_capture' },
        { label: 'Bonus Crowns', value: 'bonus_crowns' },
        { label: 'Decay Reduction', value: 'decay_reduction' },
        { label: 'Coins', value: 'coins' },
      ],
      admin: {
        description: 'Type of reward',
      },
    },
    {
      name: 'rewardValue',
      type: 'number',
      required: true,
      admin: {
        description: 'Reward value (e.g., 0.1 for 10% reduction, 10 for bonus seconds)',
      },
    },
    {
      name: 'rewardDuration',
      type: 'number',
      admin: {
        description: 'Duration in hours (null for session-based or season-based)',
      },
    },
    {
      name: 'rewardUses',
      type: 'number',
      admin: {
        description: 'Number of times to use (null for unlimited or season-based)',
      },
    },
    {
      name: 'difficulty',
      type: 'number',
      required: true,
      admin: {
        description: 'Difficulty level (1-9)',
      },
      validate: (value: number | number[] | null | undefined) => {
        if (typeof value === 'number' && (value < 1 || value > 9)) {
          return 'Difficulty must be between 1 and 9'
        }
        return true
      },
    },
    {
      name: 'description',
      type: 'text',
      required: true,
      admin: {
        description: 'Description of the reward',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this reward is active',
      },
    },
  ],
  timestamps: true,
  indexes: [
    {
      fields: ['difficulty'],
    },
    {
      fields: ['rewardType'],
    },
    {
      fields: ['isActive'],
    },
  ],
}

