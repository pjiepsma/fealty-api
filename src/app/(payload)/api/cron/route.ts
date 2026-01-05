import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  assignDailyChallengesTask,
  assignWeeklyChallengesTask,
  assignMonthlyChallengesTask,
} from '@/jobs/assignChallengesJob'
import { expireChallengesTask } from '@/jobs/expireChallengesJob'
import { dailyDecayTask } from '@/jobs/dailyDecayJob'
import { expireOldRewardsTask } from '@/jobs/expireOldRewardsJob'
import { expireSeasonRewardsTask } from '@/jobs/expireSeasonRewardsJob'
import { calculateKingStatusTask } from '@/jobs/calculateKingStatusJob'
import { pulseTask } from '@/jobs/pulseJob'
import type { PayloadRequest } from 'payload'

export async function GET(_request: Request) {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')

  // Verify the request is from Vercel Cron
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })

    // Create a minimal PayloadRequest object for jobs
    const mockReq = {
      payload,
      user: null, // Jobs run as system/admin
    } as unknown as PayloadRequest

    const results: Record<string, unknown> = {}
    const errors: string[] = []

    // Run all scheduled jobs manually
    const jobsToRun = [
      { name: 'pulse', task: pulseTask },
      { name: 'assign-daily-challenges', task: assignDailyChallengesTask },
      { name: 'assign-weekly-challenges', task: assignWeeklyChallengesTask },
      { name: 'assign-monthly-challenges', task: assignMonthlyChallengesTask },
      { name: 'expire-challenges', task: expireChallengesTask },
      { name: 'daily-decay', task: dailyDecayTask },
      { name: 'expire-old-rewards', task: expireOldRewardsTask },
      { name: 'expire-season-rewards', task: expireSeasonRewardsTask },
      { name: 'calculate-king-status', task: calculateKingStatusTask },
    ]

    for (const job of jobsToRun) {
      try {
        console.log(`Running job: ${job.name}`)
        const handler = job.task.handler
        if (typeof handler !== 'function') {
          throw new Error(`Invalid handler for job: ${job.name}`)
        }
        const result = await (
          handler as (args: { req: PayloadRequest; input: unknown }) => Promise<unknown>
        )({
          req: mockReq,
          input: {},
        })
        results[job.name] = result
        console.log(`Job ${job.name} completed:`, result)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`Job ${job.name} failed:`, errorMessage)
        errors.push(`${job.name}: ${errorMessage}`)
        results[job.name] = { state: 'failed', error: errorMessage }
      }
    }

    return Response.json({
      success: true,
      message: 'All cron jobs executed',
      timestamp: new Date().toISOString(),
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return Response.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
