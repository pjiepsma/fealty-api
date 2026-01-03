import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

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
    admin: isAdmin,
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
                  defaultValue: 1,
                  admin: {
                    description: 'Medium: target value (e.g., 1 entry)',
                  },
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 2,
                  admin: {
                    description: 'Hard: target value (e.g., 2 entries)',
                  },
                },
              ],
            },
            {
              name: 'dailyCrownClaim',
              type: 'group',
              label: 'Crown Claim',
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
              name: 'dailySessionDuration',
              type: 'group',
              label: 'Session Duration',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 900,
                  admin: {
                    description: 'Easy: target value in seconds (e.g., 900 = 15 minutes)',
                  },
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 1800,
                  admin: {
                    description: 'Medium: target value in seconds (e.g., 1800 = 30 minutes)',
                  },
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 3600,
                  admin: {
                    description: 'Hard: target value in seconds (e.g., 3600 = 60 minutes)',
                  },
                },
              ],
            },
            {
              name: 'dailyLongestSession',
              type: 'group',
              label: 'Longest Session',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 300,
                  admin: {
                    description: 'Easy: target value in seconds (e.g., 300 = 5 minutes)',
                  },
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 600,
                  admin: {
                    description: 'Medium: target value in seconds (e.g., 600 = 10 minutes)',
                  },
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 900,
                  admin: {
                    description: 'Hard: target value in seconds (e.g., 900 = 15 minutes). Maximum 60 minutes for daily challenges.',
                  },
                },
              ],
            },
            {
              name: 'dailyUniquePois',
              type: 'group',
              label: 'Unique POIs',
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
                  defaultValue: 3,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 5,
                },
              ],
            },
            {
              name: 'dailyCategoryVariety',
              type: 'group',
              label: 'Category Variety',
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
              name: 'dailyCategorySimilarity',
              type: 'group',
              label: 'Category Similarity',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 1,
                  admin: {
                    description: 'Easy: target value (e.g., 1 session at same category)',
                  },
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 2,
                  admin: {
                    description: 'Medium: target value (e.g., 2 sessions at same category)',
                  },
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 3,
                  admin: {
                    description: 'Hard: target value (e.g., 3 sessions at same category)',
                  },
                },
              ],
            },
            {
              name: 'dailyNewLocation',
              type: 'group',
              label: 'New Location',
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
                  defaultValue: 5,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 10,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 20,
                },
              ],
            },
            {
              name: 'weeklyCrownClaim',
              type: 'group',
              label: 'Crown Claim',
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
                  defaultValue: 3,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 5,
                },
              ],
            },
            {
              name: 'weeklySessionDuration',
              type: 'group',
              label: 'Session Duration',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 5400,
                  admin: {
                    description: 'Easy: target value in seconds (e.g., 5400 = 90 minutes)',
                  },
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 10800,
                  admin: {
                    description: 'Medium: target value in seconds (e.g., 10800 = 180 minutes)',
                  },
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 21600,
                  admin: {
                    description: 'Hard: target value in seconds (e.g., 21600 = 360 minutes)',
                  },
                },
              ],
            },
            {
              name: 'weeklyLongestSession',
              type: 'group',
              label: 'Longest Session',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 600,
                  admin: {
                    description: 'Easy: target value in seconds (e.g., 600 = 10 minutes)',
                  },
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 1200,
                  admin: {
                    description: 'Medium: target value in seconds (e.g., 1200 = 20 minutes)',
                  },
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 1800,
                  admin: {
                    description: 'Hard: target value in seconds (e.g., 1800 = 30 minutes). Maximum 60 minutes.',
                  },
                },
              ],
            },
            {
              name: 'weeklyUniquePois',
              type: 'group',
              label: 'Unique POIs',
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
                  defaultValue: 10,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 15,
                },
              ],
            },
            {
              name: 'weeklyCategoryVariety',
              type: 'group',
              label: 'Category Variety',
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
                  defaultValue: 4,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 6,
                },
              ],
            },
            {
              name: 'weeklyCategorySimilarity',
              type: 'group',
              label: 'Category Similarity',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 3,
                  admin: {
                    description: 'Easy: target value (e.g., 3 sessions at same category)',
                  },
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 5,
                  admin: {
                    description: 'Medium: target value (e.g., 5 sessions at same category)',
                  },
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 7,
                  admin: {
                    description: 'Hard: target value (e.g., 7 sessions at same category)',
                  },
                },
              ],
            },
            {
              name: 'weeklyNewLocation',
              type: 'group',
              label: 'New Location',
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
                  defaultValue: 3,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 5,
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
                  defaultValue: 25,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 50,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 75,
                },
              ],
            },
            {
              name: 'monthlyCrownClaim',
              type: 'group',
              label: 'Crown Claim',
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
                  defaultValue: 10,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 15,
                },
              ],
            },
            {
              name: 'monthlySessionDuration',
              type: 'group',
              label: 'Session Duration',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 21600,
                  admin: {
                    description: 'Easy: target value in seconds (e.g., 21600 = 360 minutes)',
                  },
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 43200,
                  admin: {
                    description: 'Medium: target value in seconds (e.g., 43200 = 720 minutes)',
                  },
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 86400,
                  admin: {
                    description: 'Hard: target value in seconds (e.g., 86400 = 1440 minutes)',
                  },
                },
              ],
            },
            {
              name: 'monthlyLongestSession',
              type: 'group',
              label: 'Longest Session',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 1200,
                  admin: {
                    description: 'Easy: target value in seconds (e.g., 1200 = 20 minutes). Maximum 60 minutes.',
                  },
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 2400,
                  admin: {
                    description: 'Medium: target value in seconds (e.g., 2400 = 40 minutes). Maximum 60 minutes.',
                  },
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 3600,
                  admin: {
                    description: 'Hard: target value in seconds (e.g., 3600 = 60 minutes). Maximum 60 minutes.',
                  },
                },
              ],
            },
            {
              name: 'monthlyUniquePois',
              type: 'group',
              label: 'Unique POIs',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 25,
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 50,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 75,
                },
              ],
            },
            {
              name: 'monthlyCategoryVariety',
              type: 'group',
              label: 'Category Variety',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 4,
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
                  defaultValue: 6,
                },
              ],
            },
            {
              name: 'monthlyCategorySimilarity',
              type: 'group',
              label: 'Category Similarity',
              fields: [
                {
                  name: 'easy',
                  type: 'number',
                  required: true,
                  defaultValue: 8,
                  admin: {
                    description: 'Easy: target value (e.g., 8 sessions at same category)',
                  },
                },
                {
                  name: 'medium',
                  type: 'number',
                  required: true,
                  defaultValue: 12,
                  admin: {
                    description: 'Medium: target value (e.g., 12 sessions at same category)',
                  },
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 20,
                  admin: {
                    description: 'Hard: target value (e.g., 20 sessions at same category)',
                  },
                },
              ],
            },
            {
              name: 'monthlyNewLocation',
              type: 'group',
              label: 'New Location',
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
                  defaultValue: 10,
                },
                {
                  name: 'hard',
                  type: 'number',
                  required: true,
                  defaultValue: 15,
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
                  name: 'crownClaim',
                  type: 'text',
                  required: true,
                  defaultValue: 'Get {targetValue} new crown{plural}',
                  admin: {
                    description: 'Template for crown claim challenges',
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
                  name: 'sessionDuration',
                  type: 'text',
                  required: true,
                  defaultValue: 'Log {targetValue} minutes of sessions',
                  admin: {
                    description: 'Template for session duration challenges',
                  },
                },
                {
                  name: 'longestSession',
                  type: 'text',
                  required: true,
                  defaultValue: 'Complete a {targetValue} minute session',
                  admin: {
                    description: 'Template for longest session challenges',
                  },
                },
                {
                  name: 'uniquePois',
                  type: 'text',
                  required: true,
                  defaultValue: 'Visit {targetValue} unique POI{plural}',
                  admin: {
                    description: 'Template for unique POIs challenges',
                  },
                },
                {
                  name: 'categoryVariety',
                  type: 'text',
                  required: true,
                  defaultValue: 'Visit {targetValue} different categor{plural}',
                  admin: {
                    description: 'Template for category variety challenges',
                  },
                },
                {
                  name: 'categorySimilarity',
                  type: 'text',
                  required: true,
                  defaultValue: 'Log {targetValue} session{plural} at {category}',
                  admin: {
                    description: 'Template for category similarity challenges',
                  },
                },
                {
                  name: 'newLocation',
                  type: 'text',
                  required: true,
                  defaultValue: 'Discover {targetValue} new location{plural}',
                  admin: {
                    description: 'Template for new location challenges',
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
                  name: 'crownClaim',
                  type: 'textarea',
                  required: true,
                  defaultValue: 'Get {targetValue} new crown{plural} {periodText}',
                },
                {
                  name: 'crownTakeover',
                  type: 'textarea',
                  required: true,
                  defaultValue: 'Take over {targetValue} crown{plural} from other players {periodText}',
                },
                {
                  name: 'sessionDuration',
                  type: 'textarea',
                  required: true,
                  defaultValue: 'Log at least {targetValue} minutes of total session time {periodText}',
                },
                {
                  name: 'longestSession',
                  type: 'textarea',
                  required: true,
                  defaultValue: 'Complete a single session of at least {targetValue} minutes {periodText}',
                },
                {
                  name: 'uniquePois',
                  type: 'textarea',
                  required: true,
                  defaultValue: 'Visit {targetValue} unique POI{plural} {periodText}',
                },
                {
                  name: 'categoryVariety',
                  type: 'textarea',
                  required: true,
                  defaultValue: 'Visit {targetValue} different categor{plural} {periodText}',
                },
                {
                  name: 'categorySimilarity',
                  type: 'textarea',
                  required: true,
                  defaultValue: 'Log {targetValue} session{plural} at {category} {periodText}',
                },
                {
                  name: 'newLocation',
                  type: 'textarea',
                  required: true,
                  defaultValue: 'Discover {targetValue} new location{plural} (POIs with no previous sessions) {periodText}',
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






