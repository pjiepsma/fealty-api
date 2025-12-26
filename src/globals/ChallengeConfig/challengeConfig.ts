import type { GlobalConfig } from 'payload'

export const ChallengeConfig: GlobalConfig = {
  slug: 'challenge-config',
  access: {
    read: ({ req: { user } }) => {
      // Only admins can read challenge config
      return user?.role === 'admin'
    },
    update: ({ req: { user } }) => {
      // Only admins can update challenge config
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Generation Settings',
          fields: [
            {
              name: 'dailyChallengesCount',
              type: 'number',
              required: true,
              defaultValue: 3,
              admin: {
                description: 'Number of daily challenges to generate per user',
              },
            },
            {
              name: 'weeklyChallengesCount',
              type: 'number',
              required: true,
              defaultValue: 3,
              admin: {
                description: 'Number of weekly challenges to generate for all users',
              },
            },
            {
              name: 'monthlyChallengesCount',
              type: 'number',
              required: true,
              defaultValue: 3,
              admin: {
                description: 'Number of monthly challenges to generate for all users',
              },
            },
          ],
        },
        {
          label: 'Daily Challenges',
          fields: [
            {
              name: 'dailyEntryCount',
              type: 'group',
              label: 'Entry Count',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 1,
                  admin: {
                    description: 'Easy: target value (e.g., 1 entry)',
                  },
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 3,
                  admin: {
                    description: 'Medium: target value (e.g., 3 entries)',
                  },
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 5,
                  admin: {
                    description: 'Hard: target value (e.g., 5 entries)',
                  },
                },
              ],
            },
            {
              name: 'dailyCrownCount',
              type: 'group',
              label: 'Crown Count',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 1,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 2,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 3,
                },
              ],
            },
            {
              name: 'dailyCrownTakeover',
              type: 'group',
              label: 'Crown Takeover',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 1,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 2,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 3,
                },
              ],
            },
            {
              name: 'dailyCrownReclaim',
              type: 'group',
              label: 'Crown Reclaim',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 1,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 1,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 2,
                },
              ],
            },
          ],
        },
        {
          label: 'Weekly Challenges',
          fields: [
            {
              name: 'weeklyEntryCount',
              type: 'group',
              label: 'Entry Count',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 10,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 25,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 50,
                },
              ],
            },
            {
              name: 'weeklyCrownCount',
              type: 'group',
              label: 'Crown Count',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 3,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 5,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 10,
                },
              ],
            },
            {
              name: 'weeklyCrownTakeover',
              type: 'group',
              label: 'Crown Takeover',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 2,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 5,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 8,
                },
              ],
            },
            {
              name: 'weeklyCrownReclaim',
              type: 'group',
              label: 'Crown Reclaim',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 2,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 5,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 10,
                },
              ],
            },
          ],
        },
        {
          label: 'Monthly Challenges',
          fields: [
            {
              name: 'monthlyEntryCount',
              type: 'group',
              label: 'Entry Count',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 50,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 100,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 150,
                },
              ],
            },
            {
              name: 'monthlyCrownCount',
              type: 'group',
              label: 'Crown Count',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 10,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 20,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 30,
                },
              ],
            },
            {
              name: 'monthlyCrownTakeover',
              type: 'group',
              label: 'Crown Takeover',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 10,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 20,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 30,
                },
              ],
            },
            {
              name: 'monthlyCrownReclaim',
              type: 'group',
              label: 'Crown Reclaim',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 5,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 15,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 25,
                },
              ],
            },
          ],
        },
        {
          label: 'Templates',
          fields: [
            {
              name: 'titleTemplates',
              type: 'group',
              label: 'Title Templates',
              fields: [
                {
                  name: 'entryCount',
                  type: 'text',
                  required: true,
                  defaultValue: 'Complete {targetValue} {period} {category}',
                  admin: {
                    description: 'Template for entry count challenges. Use {targetValue}, {period}, {category} as placeholders',
                  },
                },
                {
                  name: 'crownCount',
                  type: 'text',
                  required: true,
                  defaultValue: 'Become king of {targetValue} POI{plural}',
                  admin: {
                    description: 'Template for crown count challenges',
                  },
                },
                {
                  name: 'crownTakeover',
                  type: 'text',
                  required: true,
                  defaultValue: 'Take over {targetValue} crown{plural}',
                  admin: {
                    description: 'Template for crown takeover challenges',
                  },
                },
                {
                  name: 'crownReclaim',
                  type: 'text',
                  required: true,
                  defaultValue: 'Reclaim {targetValue} of your lost crown{plural}',
                  admin: {
                    description: 'Template for crown reclaim challenges',
                  },
                },
              ],
            },
            {
              name: 'descriptionTemplates',
              type: 'group',
              label: 'Description Templates',
              fields: [
                {
                  name: 'entryCount',
                  type: 'textarea',
                  required: true,
                  defaultValue: 'Complete {targetValue} entry{plural} {periodText}',
                  admin: {
                    description: 'Template for entry count challenge descriptions',
                  },
                },
                {
                  name: 'crownCount',
                  type: 'textarea',
                  required: true,
                  defaultValue: 'Become king of {targetValue} POI{plural} {periodText}',
                },
                {
                  name: 'crownTakeover',
                  type: 'textarea',
                  required: true,
                  defaultValue: 'Take over {targetValue} crown{plural} from other players {periodText}',
                },
                {
                  name: 'crownReclaim',
                  type: 'textarea',
                  required: true,
                  defaultValue: 'Reclaim {targetValue} of your lost crown{plural} {periodText}',
                },
              ],
            },
          ],
        },
        {
          label: 'Cost Settings',
          fields: [
            {
              name: 'costMultipliers',
              type: 'group',
              label: 'Cost Multipliers',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 10,
                  admin: {
                    description: 'Base cost multiplier for easy challenges',
                  },
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 50,
                  admin: {
                    description: 'Base cost multiplier for medium challenges',
                  },
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 100,
                  admin: {
                    description: 'Base cost multiplier for hard challenges',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Categories',
          fields: [
            {
              name: 'availableCategories',
              type: 'array',
              label: 'Available POI Categories',
              fields: [
                {
                  name: 'category',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'difficultyAdjustment',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Difficulty adjustment for category-specific challenges (+1, +2, etc.)',
                  },
                },
              ],
              defaultValue: [
                { category: 'park', difficultyAdjustment: 0 },
                { category: 'historic', difficultyAdjustment: 0 },
                { category: 'church', difficultyAdjustment: 0 },
                { category: 'monument', difficultyAdjustment: 0 },
                { category: 'museum', difficultyAdjustment: 0 },
                { category: 'memorial', difficultyAdjustment: 0 },
                { category: 'castle', difficultyAdjustment: 0 },
                { category: 'ruins', difficultyAdjustment: 0 },
                { category: 'artwork', difficultyAdjustment: 0 },
                { category: 'viewpoint', difficultyAdjustment: 0 },
              ],
            },
          ],
        },
      ],
    },
  ],
}



