import type { CollectionConfig } from 'payload'

export const Challenges: CollectionConfig = {
  slug: 'challenges',
  admin: {
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'User who has this challenge',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ],
      admin: {
        description: 'Challenge type',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Challenge title',
      },
    },
    {
      name: 'description',
      type: 'text',
      required: true,
      admin: {
        description: 'Challenge description',
      },
    },
    {
      name: 'challengeType',
      type: 'select',
      required: true,
      options: [
        { label: 'Entry Count', value: 'entry_count' },
        { label: 'Crown Claim', value: 'crown_claim' },
        { label: 'Session Duration', value: 'session_duration' },
        { label: 'Longest Session', value: 'longest_session' },
        { label: 'Unique POIs', value: 'unique_pois' },
        { label: 'Category Variety', value: 'category_variety' },
        { label: 'Category Similarity', value: 'category_similarity' },
        { label: 'New Location', value: 'new_location' },
      ],
      admin: {
        description: 'Type of challenge objective',
      },
    },
    {
      name: 'targetValue',
      type: 'number',
      required: true,
      admin: {
        description: 'Target value (e.g., 5 entries, 3 crowns)',
      },
    },
    {
      name: 'targetCategory',
      type: 'text',
      admin: {
        description: 'Optional: Target category (e.g., park, church)',
      },
    },
    {
      name: 'rewardDifficulty',
      type: 'number',
      required: true,
      admin: {
        description: 'Difficulty level (1-9) that determines which reward is assigned',
      },
      validate: (value: number | number[] | null | undefined) => {
        if (typeof value === 'number' && (value < 1 || value > 9)) {
          return 'Reward difficulty must be between 1 and 9'
        }
        return true
      },
    },
    {
      name: 'cost',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of coins to buy out challenge (0 means not purchasable)',
      },
    },
    {
      name: 'reward',
      type: 'relationship',
      relationTo: 'rewards',
      admin: {
        description: 'The assigned reward for this challenge (optional - coin challenges give coins directly)',
      },
    },
    {
      name: 'progress',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Current progress towards the challenge',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        description: 'When the challenge was completed',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      admin: {
        description: 'When the challenge expires (for daily/weekly/monthly)',
      },
    },
  ],
  timestamps: true,
  indexes: [
    {
      fields: ['user'],
    },
    {
      fields: ['reward'],
    },
    {
      fields: ['expiresAt'],
    },
    {
      fields: ['user', 'expiresAt'],
    },
  ],
}




