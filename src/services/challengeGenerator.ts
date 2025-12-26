import type { PayloadRequest } from 'payload'
import type { ChallengeType, DifficultyTier, Period } from '../config/challengeRules'
import {
  getChallengePreset,
  getAvailablePresets,
  getGenerationCount,
  getChallengeCost,
  generateTitle,
  generateDescription,
  getAvailableCategories,
} from '../config/challengeRules'
import { getRewardDifficulty } from '../utils/difficultyCalculator'

export interface GeneratedChallenge {
  type: Period
  title: string
  description: string
  challengeType: ChallengeType
  targetValue: number
  targetCategory?: string
  rewardDifficulty: number
  cost: number
  isPersonal: boolean
  expiresAt: string
}

/**
 * Generate challenges for a specific user
 */
export async function generateChallengesForUser(
  req: PayloadRequest,
  userId: string,
  period: Period
): Promise<GeneratedChallenge[]> {
  const count = await getGenerationCount(req, period)
  const challenges: GeneratedChallenge[] = []

  // Get available challenge types (for now, use entry_count and crown_count as primary)
  const challengeTypes: ChallengeType[] = ['entry_count', 'crown_count', 'crown_takeover', 'crown_reclaim']

  // Select difficulty tiers (aim for variety: easy, medium, hard)
  const selectedTiers = selectDifficultyTiers(count)

  // Calculate expiration date
  const expiresAt = calculateExpirationDate(period)

  // Generate challenges
  for (let i = 0; i < count && i < selectedTiers.length; i++) {
    const tier = selectedTiers[i]
    const challengeType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)]

    // Get target value from config
    const targetValue = await getChallengePreset(req, challengeType, period, tier)

    if (!targetValue) {
      console.warn(`No preset found for ${challengeType} ${period} ${tier}, skipping`)
      continue
    }

    // Get reward difficulty
    const rewardDifficulty = getRewardDifficulty(tier)

    // Get cost
    const cost = await getChallengeCost(req, tier)

    // Generate title and description
    const title = generateTitle(challengeType, targetValue, period)
    const description = generateDescription(challengeType, targetValue, period)

    challenges.push({
      type: period,
      title,
      description,
      challengeType,
      targetValue,
      rewardDifficulty,
      cost,
      isPersonal: period === 'daily', // Daily challenges are personal
      expiresAt,
    })
  }

  return challenges
}

/**
 * Generate shared challenges for all users (weekly/monthly)
 */
export async function generateSharedChallenges(
  req: PayloadRequest,
  period: Period
): Promise<GeneratedChallenge[]> {
  const count = await getGenerationCount(req, period)
  const challenges: GeneratedChallenge[] = []

  // Get available challenge types
  const challengeTypes: ChallengeType[] = ['entry_count', 'crown_count', 'crown_takeover', 'crown_reclaim']

  // Select difficulty tiers
  const selectedTiers = selectDifficultyTiers(count)

  // Calculate expiration date
  const expiresAt = calculateExpirationDate(period)

  // Generate challenges
  for (let i = 0; i < count && i < selectedTiers.length; i++) {
    const tier = selectedTiers[i]
    const challengeType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)]

    // Get target value from config
    const targetValue = await getChallengePreset(req, challengeType, period, tier)

    if (!targetValue) {
      console.warn(`No preset found for ${challengeType} ${period} ${tier}, skipping`)
      continue
    }

    // Get reward difficulty
    const rewardDifficulty = getRewardDifficulty(tier)

    // Get cost
    const cost = await getChallengeCost(req, tier)

    // Generate title and description
    const title = generateTitle(challengeType, targetValue, period)
    const description = generateDescription(challengeType, targetValue, period)

    challenges.push({
      type: period,
      title,
      description,
      challengeType,
      targetValue,
      rewardDifficulty,
      cost,
      isPersonal: false, // Shared challenges
      expiresAt,
    })
  }

  return challenges
}

/**
 * Select random difficulty tiers for variety
 * Tries to balance: easy, medium, hard when possible
 */
function selectDifficultyTiers(count: number): DifficultyTier[] {
  const tiers: DifficultyTier[] = ['easy', 'medium', 'hard']
  const selected: DifficultyTier[] = []

  // If count is 3, try to get one of each
  if (count >= 3) {
    selected.push('easy', 'medium', 'hard')
    // Shuffle and take count
    return shuffleArray(selected).slice(0, count)
  }

  // For smaller counts, randomly select
  for (let i = 0; i < count; i++) {
    const randomTier = tiers[Math.floor(Math.random() * tiers.length)]
    selected.push(randomTier)
  }

  return selected
}

/**
 * Calculate expiration date based on period
 */
function calculateExpirationDate(period: Period): string {
  const now = new Date()

  if (period === 'daily') {
    // End of today
    const expiry = new Date(now)
    expiry.setHours(23, 59, 59, 999)
    return expiry.toISOString()
  } else if (period === 'weekly') {
    // End of next Monday
    const expiry = new Date(now)
    const daysUntilMonday = (8 - expiry.getDay()) % 7 || 7
    expiry.setDate(expiry.getDate() + daysUntilMonday)
    expiry.setHours(23, 59, 59, 999)
    return expiry.toISOString()
  } else {
    // Monthly: end of current month
    const expiry = new Date(now)
    expiry.setMonth(expiry.getMonth() + 1)
    expiry.setDate(0) // Last day of current month
    expiry.setHours(23, 59, 59, 999)
    return expiry.toISOString()
  }
}

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}



