import { getPayload } from 'payload'
import config from '@payload-config'

interface RewardSeed {
  rewardType: 'entry_time_reduction' | 'bonus_seconds' | 'larger_radius' | 'bonus_crowns' | 'decay_reduction'
  rewardValue: number
  rewardDuration?: number
  rewardUses?: number
  difficulty: number
  description: string
  isActive: boolean
}

// Rewards met value × uses ≈ difficulty formule
// Voor percentages: (value × 100) × uses ≈ difficulty
// Elke difficulty heeft minstens één reward van elk beschikbaar type
const rewardSeeds: RewardSeed[] = [
  // Difficulty 1 (6 rewards) - 1 dag duration
  // Entry Time Reduction: (value × 100) × uses = 1
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.01, // 1% × 1 use = 1
    rewardDuration: 24,
    rewardUses: 1,
    difficulty: 1,
    description: '1% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.005, // 0.5% × 2 uses = 1
    rewardDuration: 24,
    rewardUses: 2,
    difficulty: 1,
    description: '0.5% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.0033, // 0.33% × 3 uses = 1
    rewardDuration: 24,
    rewardUses: 3,
    difficulty: 1,
    description: '0.33% entry time reduction',
    isActive: true,
  },
  // Decay Reduction: (value × 100) × uses = 1
  {
    rewardType: 'decay_reduction',
    rewardValue: 1.0, // 1% × 1 use = 1
    rewardDuration: 24,
    rewardUses: 1,
    difficulty: 1,
    description: '1% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 0.5, // 0.5% × 2 uses = 1
    rewardDuration: 24,
    rewardUses: 2,
    difficulty: 1,
    description: '0.5% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 0.33, // 0.33% × 3 uses = 1
    rewardDuration: 24,
    rewardUses: 3,
    difficulty: 1,
    description: '0.33% decay reduction',
    isActive: true,
  },

  // Difficulty 2 (6 rewards) - 2 dagen duration
  // Entry Time Reduction: (value × 100) × uses = 2
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.02, // 2% × 1 use = 2
    rewardDuration: 48,
    rewardUses: 1,
    difficulty: 2,
    description: '2% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.01, // 1% × 2 uses = 2
    rewardDuration: 48,
    rewardUses: 2,
    difficulty: 2,
    description: '1% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.0067, // 0.67% × 3 uses = 2
    rewardDuration: 48,
    rewardUses: 3,
    difficulty: 2,
    description: '0.67% entry time reduction',
    isActive: true,
  },
  // Decay Reduction: (value × 100) × uses = 2
  {
    rewardType: 'decay_reduction',
    rewardValue: 2.0, // 2% × 1 use = 2
    rewardDuration: 48,
    rewardUses: 1,
    difficulty: 2,
    description: '2% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 1.0, // 1% × 2 uses = 2
    rewardDuration: 48,
    rewardUses: 2,
    difficulty: 2,
    description: '1% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 0.67, // 0.67% × 3 uses = 2
    rewardDuration: 48,
    rewardUses: 3,
    difficulty: 2,
    description: '0.67% decay reduction',
    isActive: true,
  },

  // Difficulty 3 (9 rewards) - 3 dagen duration
  // Entry Time Reduction: (value × 100) × uses = 3
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.03, // 3% × 1 use = 3
    rewardDuration: 72,
    rewardUses: 1,
    difficulty: 3,
    description: '3% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.015, // 1.5% × 2 uses = 3
    rewardDuration: 72,
    rewardUses: 2,
    difficulty: 3,
    description: '1.5% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.01, // 1% × 3 uses = 3
    rewardDuration: 72,
    rewardUses: 3,
    difficulty: 3,
    description: '1% entry time reduction',
    isActive: true,
  },
  // Decay Reduction: (value × 100) × uses = 3
  {
    rewardType: 'decay_reduction',
    rewardValue: 3.0, // 3% × 1 use = 3
    rewardDuration: 72,
    rewardUses: 1,
    difficulty: 3,
    description: '3% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 1.5, // 1.5% × 2 uses = 3
    rewardDuration: 72,
    rewardUses: 2,
    difficulty: 3,
    description: '1.5% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 1.0, // 1% × 3 uses = 3
    rewardDuration: 72,
    rewardUses: 3,
    difficulty: 3,
    description: '1% decay reduction',
    isActive: true,
  },
  // Larger Radius: (value × 100) × uses = 3
  {
    rewardType: 'larger_radius',
    rewardValue: 0.03, // 3% × 1 use = 3
    rewardDuration: 72,
    rewardUses: 1,
    difficulty: 3,
    description: '3% larger radius',
    isActive: true,
  },
  {
    rewardType: 'larger_radius',
    rewardValue: 0.015, // 1.5% × 2 uses = 3
    rewardDuration: 72,
    rewardUses: 2,
    difficulty: 3,
    description: '1.5% larger radius',
    isActive: true,
  },
  {
    rewardType: 'larger_radius',
    rewardValue: 0.01, // 1% × 3 uses = 3
    rewardDuration: 72,
    rewardUses: 3,
    difficulty: 3,
    description: '1% larger radius',
    isActive: true,
  },

  // Difficulty 4 (9 rewards) - 4 dagen duration
  // Entry Time Reduction: (value × 100) × uses = 4
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.04, // 4% × 1 use = 4
    rewardDuration: 96,
    rewardUses: 1,
    difficulty: 4,
    description: '4% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.02, // 2% × 2 uses = 4
    rewardDuration: 96,
    rewardUses: 2,
    difficulty: 4,
    description: '2% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.0133, // 1.33% × 3 uses = 4
    rewardDuration: 96,
    rewardUses: 3,
    difficulty: 4,
    description: '1.33% entry time reduction',
    isActive: true,
  },
  // Decay Reduction: (value × 100) × uses = 4
  {
    rewardType: 'decay_reduction',
    rewardValue: 4.0, // 4% × 1 use = 4
    rewardDuration: 96,
    rewardUses: 1,
    difficulty: 4,
    description: '4% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 2.0, // 2% × 2 uses = 4
    rewardDuration: 96,
    rewardUses: 2,
    difficulty: 4,
    description: '2% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 1.33, // 1.33% × 3 uses = 4
    rewardDuration: 96,
    rewardUses: 3,
    difficulty: 4,
    description: '1.33% decay reduction',
    isActive: true,
  },
  // Larger Radius: (value × 100) × uses = 4
  {
    rewardType: 'larger_radius',
    rewardValue: 0.04, // 4% × 1 use = 4
    rewardDuration: 96,
    rewardUses: 1,
    difficulty: 4,
    description: '4% larger radius',
    isActive: true,
  },
  {
    rewardType: 'larger_radius',
    rewardValue: 0.02, // 2% × 2 uses = 4
    rewardDuration: 96,
    rewardUses: 2,
    difficulty: 4,
    description: '2% larger radius',
    isActive: true,
  },
  {
    rewardType: 'larger_radius',
    rewardValue: 0.0133, // 1.33% × 3 uses = 4
    rewardDuration: 96,
    rewardUses: 3,
    difficulty: 4,
    description: '1.33% larger radius',
    isActive: true,
  },

  // Difficulty 5 (9 rewards) - 5 dagen duration
  // Entry Time Reduction: (value × 100) × uses = 5
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.05, // 5% × 1 use = 5
    rewardDuration: 120,
    rewardUses: 1,
    difficulty: 5,
    description: '5% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.025, // 2.5% × 2 uses = 5
    rewardDuration: 120,
    rewardUses: 2,
    difficulty: 5,
    description: '2.5% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.0167, // 1.67% × 3 uses = 5
    rewardDuration: 120,
    rewardUses: 3,
    difficulty: 5,
    description: '1.67% entry time reduction',
    isActive: true,
  },
  // Decay Reduction: (value × 100) × uses = 5
  {
    rewardType: 'decay_reduction',
    rewardValue: 5.0, // 5% × 1 use = 5
    rewardDuration: 120,
    rewardUses: 1,
    difficulty: 5,
    description: '5% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 2.5, // 2.5% × 2 uses = 5
    rewardDuration: 120,
    rewardUses: 2,
    difficulty: 5,
    description: '2.5% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 1.67, // 1.67% × 3 uses = 5
    rewardDuration: 120,
    rewardUses: 3,
    difficulty: 5,
    description: '1.67% decay reduction',
    isActive: true,
  },
  // Larger Radius: (value × 100) × uses = 5
  {
    rewardType: 'larger_radius',
    rewardValue: 0.05, // 5% × 1 use = 5
    rewardDuration: 120,
    rewardUses: 1,
    difficulty: 5,
    description: '5% larger radius',
    isActive: true,
  },
  {
    rewardType: 'larger_radius',
    rewardValue: 0.025, // 2.5% × 2 uses = 5
    rewardDuration: 120,
    rewardUses: 2,
    difficulty: 5,
    description: '2.5% larger radius',
    isActive: true,
  },
  {
    rewardType: 'larger_radius',
    rewardValue: 0.0167, // 1.67% × 3 uses = 5
    rewardDuration: 120,
    rewardUses: 3,
    difficulty: 5,
    description: '1.67% larger radius',
    isActive: true,
  },

  // Difficulty 6 (9 rewards) - 6 dagen duration
  // Entry Time Reduction: (value × 100) × uses = 6
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.06, // 6% × 1 use = 6
    rewardDuration: 144,
    rewardUses: 1,
    difficulty: 6,
    description: '6% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.03, // 3% × 2 uses = 6
    rewardDuration: 144,
    rewardUses: 2,
    difficulty: 6,
    description: '3% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.02, // 2% × 3 uses = 6
    rewardDuration: 144,
    rewardUses: 3,
    difficulty: 6,
    description: '2% entry time reduction',
    isActive: true,
  },
  // Decay Reduction: (value × 100) × uses = 6
  {
    rewardType: 'decay_reduction',
    rewardValue: 6.0, // 6% × 1 use = 6
    rewardDuration: 144,
    rewardUses: 1,
    difficulty: 6,
    description: '6% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 3.0, // 3% × 2 uses = 6
    rewardDuration: 144,
    rewardUses: 2,
    difficulty: 6,
    description: '3% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 2.0, // 2% × 3 uses = 6
    rewardDuration: 144,
    rewardUses: 3,
    difficulty: 6,
    description: '2% decay reduction',
    isActive: true,
  },
  // Larger Radius: (value × 100) × uses = 6
  {
    rewardType: 'larger_radius',
    rewardValue: 0.06, // 6% × 1 use = 6
    rewardDuration: 144,
    rewardUses: 1,
    difficulty: 6,
    description: '6% larger radius',
    isActive: true,
  },
  {
    rewardType: 'larger_radius',
    rewardValue: 0.03, // 3% × 2 uses = 6
    rewardDuration: 144,
    rewardUses: 2,
    difficulty: 6,
    description: '3% larger radius',
    isActive: true,
  },
  {
    rewardType: 'larger_radius',
    rewardValue: 0.02, // 2% × 3 uses = 6
    rewardDuration: 144,
    rewardUses: 3,
    difficulty: 6,
    description: '2% larger radius',
    isActive: true,
  },

  // Difficulty 7 (5 rewards) - Permanent
  // Entry Time Reduction: (value × 100) × uses = 7
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.07, // 7% × 1 use = 7
    rewardUses: 1,
    difficulty: 7,
    description: '7% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.035, // 3.5% × 2 uses = 7
    rewardUses: 2,
    difficulty: 7,
    description: '3.5% entry time reduction',
    isActive: true,
  },
  // Decay Reduction: (value × 100) × uses = 7
  {
    rewardType: 'decay_reduction',
    rewardValue: 7.0, // 7% × 1 use = 7
    rewardUses: 1,
    difficulty: 7,
    description: '7% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 3.5, // 3.5% × 2 uses = 7
    rewardUses: 2,
    difficulty: 7,
    description: '3.5% decay reduction',
    isActive: true,
  },
  // Bonus Crowns
  {
    rewardType: 'bonus_crowns',
    rewardValue: 1,
    rewardUses: 1,
    difficulty: 7,
    description: '1 bonus crown',
    isActive: true,
  },

  // Difficulty 8 (5 rewards) - Permanent
  // Entry Time Reduction: (value × 100) × uses = 8
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.08, // 8% × 1 use = 8
    rewardUses: 1,
    difficulty: 8,
    description: '8% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.04, // 4% × 2 uses = 8
    rewardUses: 2,
    difficulty: 8,
    description: '4% entry time reduction',
    isActive: true,
  },
  // Decay Reduction: (value × 100) × uses = 8
  {
    rewardType: 'decay_reduction',
    rewardValue: 8.0, // 8% × 1 use = 8
    rewardUses: 1,
    difficulty: 8,
    description: '8% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 4.0, // 4% × 2 uses = 8
    rewardUses: 2,
    difficulty: 8,
    description: '4% decay reduction',
    isActive: true,
  },
  // Bonus Crowns
  {
    rewardType: 'bonus_crowns',
    rewardValue: 2,
    rewardUses: 1,
    difficulty: 8,
    description: '2 bonus crowns',
    isActive: true,
  },

  // Difficulty 9 (5 rewards) - Permanent
  // Entry Time Reduction: (value × 100) × uses = 9
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.09, // 9% × 1 use = 9
    rewardUses: 1,
    difficulty: 9,
    description: '9% entry time reduction',
    isActive: true,
  },
  {
    rewardType: 'entry_time_reduction',
    rewardValue: 0.045, // 4.5% × 2 uses = 9
    rewardUses: 2,
    difficulty: 9,
    description: '4.5% entry time reduction',
    isActive: true,
  },
  // Decay Reduction: (value × 100) × uses = 9
  {
    rewardType: 'decay_reduction',
    rewardValue: 9.0, // 9% × 1 use = 9
    rewardUses: 1,
    difficulty: 9,
    description: '9% decay reduction',
    isActive: true,
  },
  {
    rewardType: 'decay_reduction',
    rewardValue: 4.5, // 4.5% × 2 uses = 9
    rewardUses: 2,
    difficulty: 9,
    description: '4.5% decay reduction',
    isActive: true,
  },
  // Bonus Crowns
  {
    rewardType: 'bonus_crowns',
    rewardValue: 3,
    rewardUses: 1,
    difficulty: 9,
    description: '3 bonus crowns',
    isActive: true,
  },
]

async function seedRewards() {
  try {
    console.log('Starting reward seed...')
    const payload = await getPayload({ config })

    // Cleanup: Verwijder eerst alle bestaande rewards
    console.log('Cleaning up existing rewards...')
    const existingRewards = await payload.find({
      collection: 'rewards',
      limit: 10000,
    })

    if (existingRewards.docs.length > 0) {
      console.log(`Found ${existingRewards.docs.length} existing rewards, deleting...`)
      for (const reward of existingRewards.docs) {
        try {
          await payload.delete({
            collection: 'rewards',
            id: reward.id,
          })
        } catch (error) {
          console.error(`Error deleting reward ${reward.id}:`, error)
        }
      }
      console.log(`Deleted ${existingRewards.docs.length} existing rewards`)
    } else {
      console.log('No existing rewards found')
    }

    // Create new rewards
    let createdCount = 0
    let errorCount = 0

    for (const rewardSeed of rewardSeeds) {
      try {
        await payload.create({
          collection: 'rewards',
          data: rewardSeed,
        })

        const usesInfo = rewardSeed.rewardUses ? `, ${rewardSeed.rewardUses} use(s)` : ', 1 use'
        console.log(`Created reward: ${rewardSeed.description} (difficulty ${rewardSeed.difficulty}${usesInfo})`)
        createdCount++
      } catch (error) {
        console.error(`Error creating reward for difficulty ${rewardSeed.difficulty}, type ${rewardSeed.rewardType}:`, error)
        errorCount++
      }
    }

    console.log(`\nSeed completed!`)
    console.log(`Created: ${createdCount} rewards`)
    console.log(`Errors: ${errorCount} rewards`)
    console.log(`Total: ${rewardSeeds.length} rewards in seed data`)

    return {
      created: createdCount,
      errors: errorCount,
      total: rewardSeeds.length,
      deleted: existingRewards.docs.length,
    }
  } catch (error) {
    console.error('Error seeding rewards:', error)
    throw error
  }
}

// Run if executed directly
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/')) || process.argv[1]?.includes('seedRewards')) {
  seedRewards()
}

export { seedRewards }
