import type { DifficultyTier } from '../config/challengeRules'

/**
 * Map difficulty tier to reward difficulty range
 * Easy → 1-3, Medium → 4-6, Hard → 7-9
 */
export function getRewardDifficultyRange(tier: DifficultyTier): { min: number; max: number } {
  switch (tier) {
    case 'easy':
      return { min: 1, max: 3 }
    case 'medium':
      return { min: 4, max: 6 }
    case 'hard':
      return { min: 7, max: 9 }
    default:
      return { min: 1, max: 3 }
  }
}

/**
 * Get a random reward difficulty value within the tier's range
 */
export function getRandomRewardDifficulty(tier: DifficultyTier): number {
  const { min, max } = getRewardDifficultyRange(tier)
  // Return a random integer between min and max (inclusive)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Get reward difficulty with optional category adjustment
 */
export function getRewardDifficulty(tier: DifficultyTier, categoryAdjustment: number = 0): number {
  let difficulty = getRandomRewardDifficulty(tier)
  
  // Apply category adjustment (if category-specific challenge is harder)
  if (categoryAdjustment > 0) {
    difficulty = Math.min(9, difficulty + categoryAdjustment)
  }
  
  return difficulty
}



