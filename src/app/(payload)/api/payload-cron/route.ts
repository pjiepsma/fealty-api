import { NextResponse } from 'next/server'
import { runAssignDailyChallenges } from '@/jobs/assignDailyChallengesJobRunner'
import { runAssignWeeklyChallenges } from '@/jobs/assignWeeklyChallengesJobRunner'
import { runAssignMonthlyChallenges } from '@/jobs/assignMonthlyChallengesJobRunner'
import { runExpireChallenges } from '@/jobs/expireChallengesJobRunner'
import { runExpireOldRewards } from '@/jobs/expireOldRewardsJobRunner'
import { runExpireSeasonRewards } from '@/jobs/expireSeasonRewardsJobRunner'
import { runCalculateKingStatus } from '@/jobs/calculateKingStatusJobRunner'
import { runDailyDecay } from '@/jobs/dailyDecayJobRunner'

/**
 * Validates cron job requests using CRON_SECRET authentication
 * @description Implements Vercel's official cron job security pattern:
 * - Primary: Checks Authorization header for "Bearer {CRON_SECRET}" (production)
 * - Fallback: Checks query parameter "secret" for manual testing
 * Source: https://dev.to/aaronksaunders/run-payload-jobs-on-vercel-serverless-step-by-step-migration-aj9
 */
const isAuthorized = (req: Request): boolean => {
  const configured = process.env.CRON_SECRET
  if (!configured) {
    throw new Error('CRON_SECRET environment variable is not configured')
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    console.log('[CRON] ❌ No authorization header provided')
    return false
  }

  // Check if Authorization header matches CRON_SECRET (as per Vercel docs)
  if (authHeader === `Bearer ${configured}`) {
    console.log('[CRON] ✅ Authorized via Authorization header')
    return true
  }

  // Check query param for manual testing
  try {
    const url = new URL(req.url)
    const qsSecret = url.searchParams.get('secret')
    if (qsSecret && qsSecret === configured) {
      console.log('[CRON] ✅ Authorized via query parameter')
      return true
    }
  } catch (e) {
    console.log('[CRON] Error parsing URL:', e)
  }

  console.log('[CRON] ❌ Authorization failed')
  return false
}

export const dynamic = 'force-dynamic'

async function runScheduledJobs() {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = now.getUTCDate() // 1-31

  console.log(`[CRON] Date check: Day of week=${dayOfWeek}, Day of month=${dayOfMonth}`)

  const results: Record<string, unknown> = {}

  // ALWAYS run daily challenges
  console.log('[CRON] Running daily challenges...')
  results.dailyChallenges = await runAssignDailyChallenges()

  // ALWAYS run daily maintenance jobs
  console.log('[CRON] 🧹 Running daily maintenance jobs...')

  console.log('[CRON] Cleaning up expired challenges...')
  results.expireChallenges = await runExpireChallenges()

  console.log('[CRON] Cleaning up expired rewards...')
  results.expireOldRewards = await runExpireOldRewards()

  console.log('[CRON] Expiring season rewards...')
  results.expireSeasonRewards = await runExpireSeasonRewards()

  console.log('[CRON] Calculating king status...')
  results.calculateKingStatus = await runCalculateKingStatus()

  console.log('[CRON] Applying daily decay...')
  results.dailyDecay = await runDailyDecay()

  // Run weekly challenges on Mondays (day 1)
  if (dayOfWeek === 1) {
    console.log('[CRON] 📅 Monday detected! Running weekly challenges...')
    results.weeklyChallenges = await runAssignWeeklyChallenges()
  }

  // Run monthly challenges on the 1st of the month
  if (dayOfMonth === 1) {
    console.log('[CRON] 📆 First of the month! Running monthly challenges...')
    results.monthlyChallenges = await runAssignMonthlyChallenges()
  }

  console.log('[CRON] ✅ All jobs completed:', results)
  return results
}

export async function GET(req: Request) {
  console.log('[CRON] 🔔 Processing scheduled jobs request (GET)')

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[CRON] Authorization successful, determining which jobs to run...')

  const results = await runScheduledJobs()
  return NextResponse.json(results)
}

export async function POST(req: Request) {
  console.log('[CRON] 🔔 Processing scheduled jobs request (POST)')

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[CRON] Authorization successful, determining which jobs to run...')

  const results = await runScheduledJobs()
  return NextResponse.json(results)
}
