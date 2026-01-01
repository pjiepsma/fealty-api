import type { PayloadRequest } from 'payload'
import type { ChallengeType, DifficultyTier, Period } from '../config/challengeRules'
import {
  getChallengePreset,
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

  // Get available challenge types
  const challengeTypes: ChallengeType[] = ['entry_count', 'crown_claim', 'session_duration', 'longest_session', 'unique_pois', 'category_variety', 'category_similarity', 'new_location']

  // Select difficulty tiers (aim for variety: easy, medium, hard)
  const selectedTiers = selectDifficultyTiers(count)

  // Calculate expiration date
  const expiresAt = calculateExpirationDate(period)

  // Track used challenge types to avoid duplicates
  const usedTypes: ChallengeType[] = []
  const availableTypes = [...challengeTypes]

  // Generate challenges
  for (let i = 0; i < count && i < selectedTiers.length; i++) {
    const tier = selectedTiers[i]
    
    // If no more unique types available, break
    if (availableTypes.length === 0) {
      console.warn(`Cannot generate more unique challenges for ${period}, all types used`)
      break
    }

    // Select a random challenge type from available types (excluding used ones)
    const randomIndex = Math.floor(Math.random() * availableTypes.length)
    const challengeType = availableTypes[randomIndex]
    
    // Remove selected type from available types to prevent duplicates
    availableTypes.splice(randomIndex, 1)
    usedTypes.push(challengeType)

    // Get target value from config
    let targetValue = await getChallengePreset(req, challengeType, period, tier)

    if (!targetValue) {
      console.warn(`No preset found for ${challengeType} ${period} ${tier}, skipping`)
      continue
    }

    // Validate challenge limits
    if (challengeType === 'longest_session') {
      // Longest session: maximum 60 minutes (3600 seconds) for all periods
      const maxSeconds = 3600 // 60 minutes
      if (targetValue > maxSeconds) {
        console.warn(`${period} ${challengeType} challenge: targetValue ${targetValue}s exceeds 60 minute limit, capping at ${maxSeconds}s`)
        targetValue = maxSeconds
      }
    } else if (period === 'daily' && challengeType === 'session_duration') {
      // Daily session duration: maximum 60 minutes (3600 seconds)
      const maxSeconds = 3600 // 60 minutes
      if (targetValue > maxSeconds) {
        console.warn(`Daily ${challengeType} challenge: targetValue ${targetValue}s exceeds 60 minute limit, capping at ${maxSeconds}s`)
        targetValue = maxSeconds
      }
    }

    // Select category for category-specific challenges (before calculating reward difficulty)
    let targetCategory: string | undefined
    let categoryAdjustment = 0
    if (challengeType === 'category_similarity' || challengeType === 'entry_count') {
      const categories = await getAvailableCategories(req)
      if (categories.length > 0) {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)]
        targetCategory = randomCategory.category
        categoryAdjustment = randomCategory.difficultyAdjustment || 0
      }
    }

    // Get reward difficulty (based on period, with category adjustment if applicable)
    const rewardDifficulty = getRewardDifficulty(tier, categoryAdjustment, period)

    // Get cost
    const cost = await getChallengeCost(req, tier)

    // Generate title and description
    const title = generateTitle(challengeType, targetValue, period, targetCategory)
    const description = generateDescription(challengeType, targetValue, period, targetCategory)

    challenges.push({
      type: period,
      title,
      description,
      challengeType,
      targetValue,
      targetCategory,
      rewardDifficulty,
      cost,
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
  const challengeTypes: ChallengeType[] = ['entry_count', 'crown_claim', 'session_duration', 'longest_session', 'unique_pois', 'category_variety', 'category_similarity', 'new_location']

  // Select difficulty tiers
  const selectedTiers = selectDifficultyTiers(count)

  // Calculate expiration date
  const expiresAt = calculateExpirationDate(period)

  // Generate challenges
  for (let i = 0; i < count && i < selectedTiers.length; i++) {
    const tier = selectedTiers[i]
    const challengeType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)]

    // Get target value from config
    let targetValue = await getChallengePreset(req, challengeType, period, tier)

    if (!targetValue) {
      console.warn(`No preset found for ${challengeType} ${period} ${tier}, skipping`)
      continue
    }

    // Validate challenge limits
    if (challengeType === 'longest_session') {
      // Longest session: maximum 60 minutes (3600 seconds) for all periods
      const maxSeconds = 3600 // 60 minutes
      if (targetValue > maxSeconds) {
        console.warn(`${period} ${challengeType} challenge: targetValue ${targetValue}s exceeds 60 minute limit, capping at ${maxSeconds}s`)
        targetValue = maxSeconds
      }
    } else if (period === 'daily' && challengeType === 'session_duration') {
      // Daily session duration: maximum 60 minutes (3600 seconds)
      const maxSeconds = 3600 // 60 minutes
      if (targetValue > maxSeconds) {
        console.warn(`Daily ${challengeType} challenge: targetValue ${targetValue}s exceeds 60 minute limit, capping at ${maxSeconds}s`)
        targetValue = maxSeconds
      }
    }

    // Select category for category-specific challenges (before calculating reward difficulty)
    let targetCategory: string | undefined
    let categoryAdjustment = 0
    if (challengeType === 'category_similarity' || challengeType === 'entry_count') {
      const categories = await getAvailableCategories(req)
      if (categories.length > 0) {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)]
        targetCategory = randomCategory.category
        categoryAdjustment = randomCategory.difficultyAdjustment || 0
      }
    }

    // Get reward difficulty (based on period, with category adjustment if applicable)
    const rewardDifficulty = getRewardDifficulty(tier, categoryAdjustment, period)

    // Get cost
    const cost = await getChallengeCost(req, tier)

    // Generate title and description
    const title = generateTitle(challengeType, targetValue, period, targetCategory)
    const description = generateDescription(challengeType, targetValue, period, targetCategory)

    challenges.push({
      type: period,
      title,
      description,
      challengeType,
      targetValue,
      targetCategory,
      rewardDifficulty,
      cost,
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





