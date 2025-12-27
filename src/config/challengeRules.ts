import type { PayloadRequest } from 'payload'

export type ChallengeType = 'entry_count' | 'crown_claim' | 'session_duration' | 'longest_session' | 'unique_pois' | 'category_variety' | 'category_similarity' | 'new_location'
export type Period = 'daily' | 'weekly' | 'monthly'
export type DifficultyTier = 'easy' | 'medium' | 'hard'

export interface ChallengePreset {
  targetValue: number
  tier: DifficultyTier
}

/**
 * Get challenge preset (target value) for a given challenge type, period, and difficulty tier
 */
export async function getChallengePreset(
  req: PayloadRequest,
  challengeType: ChallengeType,
  period: Period,
  tier: DifficultyTier
): Promise<number | null> {
  try {
    const config = await req.payload.findGlobal({
      slug: 'challenge-config',
    })

    if (!config) {
      console.error('Challenge config not found')
      return null
    }

    // Map challenge type and period to config field name
    // Convert challengeType from snake_case to camelCase: entry_count -> EntryCount, crown_count -> CrownCount, etc.
    const camelCaseType = challengeType
      .split('_')
      .map((word) => capitalizeFirst(word))
      .join('')
    const fieldName = `${period}${camelCaseType}` as keyof typeof config

    const presetGroup = config[fieldName] as { easy?: number; medium?: number; hard?: number } | undefined

    if (!presetGroup) {
      console.error(`No preset found for ${fieldName}`)
      return null
    }

    const targetValue = presetGroup[tier]
    return typeof targetValue === 'number' ? targetValue : null
  } catch (error) {
    console.error('Error getting challenge preset:', error)
    return null
  }
}

/**
 * Get all available difficulty tiers for a challenge type and period
 */
export async function getAvailablePresets(
  req: PayloadRequest,
  challengeType: ChallengeType,
  period: Period
): Promise<ChallengePreset[]> {
  try {
    const config = await req.payload.findGlobal({
      slug: 'challenge-config',
    })

    if (!config) {
      return []
    }

    // Convert challengeType from snake_case to camelCase
    const camelCaseType = challengeType
      .split('_')
      .map((word) => capitalizeFirst(word))
      .join('')
    const fieldName = `${period}${camelCaseType}` as keyof typeof config
    const presetGroup = config[fieldName] as { easy?: number; medium?: number; hard?: number } | undefined

    if (!presetGroup) {
      return []
    }

    const presets: ChallengePreset[] = []

    if (typeof presetGroup.easy === 'number') {
      presets.push({ targetValue: presetGroup.easy, tier: 'easy' })
    }
    if (typeof presetGroup.medium === 'number') {
      presets.push({ targetValue: presetGroup.medium, tier: 'medium' })
    }
    if (typeof presetGroup.hard === 'number') {
      presets.push({ targetValue: presetGroup.hard, tier: 'hard' })
    }

    return presets
  } catch (error) {
    console.error('Error getting available presets:', error)
    return []
  }
}

/**
 * Get generation count for a period
 */
export async function getGenerationCount(req: PayloadRequest, period: Period): Promise<number> {
  try {
    const config = await req.payload.findGlobal({
      slug: 'challenge-config',
    })

    if (!config) {
      return period === 'daily' ? 3 : 3 // Default fallback
    }

    const countField = `${period}ChallengesCount` as keyof typeof config
    const count = config[countField]

    return typeof count === 'number' ? count : 3
  } catch (error) {
    console.error('Error getting generation count:', error)
    return 3
  }
}

/**
 * Get cost for a challenge based on tier
 */
export async function getChallengeCost(req: PayloadRequest, tier: DifficultyTier): Promise<number> {
  try {
    const config = await req.payload.findGlobal({
      slug: 'challenge-config',
    })

    if (!config) {
      // Default fallback costs
      return tier === 'easy' ? 10 : tier === 'medium' ? 50 : 100
    }

    const costMultipliers = config.costMultipliers as { easy?: number; medium?: number; hard?: number } | undefined

    if (!costMultipliers) {
      return tier === 'easy' ? 10 : tier === 'medium' ? 50 : 100
    }

    const multiplier = costMultipliers[tier]
    return typeof multiplier === 'number' ? multiplier : tier === 'easy' ? 10 : tier === 'medium' ? 50 : 100
  } catch (error) {
    console.error('Error getting challenge cost:', error)
    return tier === 'easy' ? 10 : tier === 'medium' ? 50 : 100
  }
}

/**
 * Generate title from template
 */
export function generateTitle(
  challengeType: ChallengeType,
  targetValue: number,
  period: Period,
  category?: string
): string {
  const templates: Record<ChallengeType, string> = {
    entry_count: 'Complete {targetValue} {period} {category}',
    crown_claim: 'Get {targetValue} new crown{plural}',
    session_duration: 'Log {targetValue} minutes of sessions',
    longest_session: 'Complete a {targetValue} minute session',
    unique_pois: 'Visit {targetValue} unique POI{plural}',
    category_variety: 'Visit {targetValue} different categor{plural}',
    category_similarity: 'Log {targetValue} session{plural} at {category}',
    new_location: 'Discover {targetValue} new location{plural}',
  }

  let template = templates[challengeType]

  // Convert seconds to minutes for time-based challenges
  let displayValue = targetValue
  if (challengeType === 'session_duration' || challengeType === 'longest_session') {
    displayValue = Math.round(targetValue / 60) // Convert seconds to minutes
  }

  // Replace placeholders
  template = template.replace('{targetValue}', displayValue.toString())
  template = template.replace('{plural}', displayValue === 1 ? '' : 's')
  template = template.replace('{period}', period)
  template = template.replace('{category}', category || 'entries')

  return template
}

/**
 * Generate description from template
 */
export function generateDescription(
  challengeType: ChallengeType,
  targetValue: number,
  period: Period,
  category?: string
): string {
  const periodText = period === 'daily' ? 'today' : period === 'weekly' ? 'this week' : 'this month'

  // Convert seconds to minutes for time-based challenges
  let displayValue = targetValue
  if (challengeType === 'session_duration' || challengeType === 'longest_session') {
    displayValue = Math.round(targetValue / 60) // Convert seconds to minutes
  }

  const templates: Record<ChallengeType, string> = {
    entry_count: `Complete ${targetValue} entry${targetValue === 1 ? '' : 's'} ${periodText}${category ? ` at ${category}s` : ''}`,
    crown_claim: `Get ${targetValue} new crown${targetValue === 1 ? '' : 's'} ${periodText}`,
    session_duration: `Log at least ${displayValue} minutes of total session time ${periodText}`,
    longest_session: `Complete a single session of at least ${displayValue} minutes ${periodText}`,
    unique_pois: `Visit ${targetValue} unique POI${targetValue === 1 ? '' : 's'} ${periodText}`,
    category_variety: `Visit ${targetValue} different categor${targetValue === 1 ? 'y' : 'ies'} ${periodText}`,
    category_similarity: `Log ${targetValue} session${targetValue === 1 ? '' : 's'} at ${category || 'the same category'} ${periodText}`,
    new_location: `Discover ${targetValue} new location${targetValue === 1 ? '' : 's'} (POIs with no previous sessions) ${periodText}`,
  }

  return templates[challengeType]
}

/**
 * Get available categories
 */
export async function getAvailableCategories(req: PayloadRequest): Promise<Array<{ category: string; difficultyAdjustment: number }>> {
  try {
    const config = await req.payload.findGlobal({
      slug: 'challenge-config',
    })

    if (!config) {
      return []
    }

    const categories = config.availableCategories as Array<{ category: string; difficultyAdjustment: number }> | undefined

    return categories || []
  } catch (error) {
    console.error('Error getting available categories:', error)
    return []
  }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

