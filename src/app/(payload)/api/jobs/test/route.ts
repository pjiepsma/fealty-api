import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { assignDailyChallengesTask, assignWeeklyChallengesTask, assignMonthlyChallengesTask } from '@/jobs/assignChallengesJob'
import { expireChallengesTask } from '@/jobs/expireChallengesJob'
import { dailyDecayTask } from '@/jobs/dailyDecayJob'
import { pulseTask } from '@/jobs/pulseJob'
import type { PayloadRequest } from 'payload'

type JobSlug =
  | 'pulse'
  | 'assign-daily-challenges'
  | 'assign-weekly-challenges'
  | 'assign-monthly-challenges'
  | 'expire-challenges'
  | 'daily-decay'

const jobHandlers: Record<JobSlug, typeof assignDailyChallengesTask> = {
  'pulse': pulseTask,
  'assign-daily-challenges': assignDailyChallengesTask,
  'assign-weekly-challenges': assignWeeklyChallengesTask,
  'assign-monthly-challenges': assignMonthlyChallengesTask,
  'expire-challenges': expireChallengesTask,
  'daily-decay': dailyDecayTask,
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { jobSlug } = body

    if (!jobSlug) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: jobSlug',
        },
        { status: 400 },
      )
    }

    const validJobSlugs: JobSlug[] = [
      'pulse',
      'assign-daily-challenges',
      'assign-weekly-challenges',
      'assign-monthly-challenges',
      'expire-challenges',
      'daily-decay',
    ]

    if (!validJobSlugs.includes(jobSlug as JobSlug)) {
      return NextResponse.json(
        {
          error: `Invalid jobSlug. Must be one of: ${validJobSlugs.join(', ')}`,
        },
        { status: 400 },
      )
    }

    // Get the task config for this job
    const taskConfig = jobHandlers[jobSlug as JobSlug]
    
    if (!taskConfig) {
      return NextResponse.json(
        {
          error: `Handler not found for job: ${jobSlug}`,
        },
        { status: 404 },
      )
    }

    // Create a minimal PayloadRequest object
    // Using a simpler approach: just pass payload and let the handler work with it
    const mockReq = {
      payload,
      user: null, // Jobs run as system/admin
    } as unknown as PayloadRequest

    // Execute the job handler directly
    // The handler expects { req, input } as arguments
    // Type assertion needed because TypeScript can't infer the handler type correctly
    const handler = taskConfig.handler
    if (typeof handler !== 'function') {
      return NextResponse.json(
        {
          error: `Invalid handler for job: ${jobSlug}`,
        },
        { status: 500 },
      )
    }
    
    const result = await (handler as (args: { req: PayloadRequest; input: unknown }) => Promise<unknown>)({
      req: mockReq,
      input: {},
    })

    return NextResponse.json({
      success: true,
      jobSlug,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error executing job:', error)
    return NextResponse.json(
      {
        error: 'Failed to execute job',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    availableJobs: [
      {
        slug: 'pulse',
        description: 'Simple pulse job that logs success (runs hourly)',
      },
      {
        slug: 'assign-daily-challenges',
        description: 'Assign daily challenges to all users',
      },
      {
        slug: 'assign-weekly-challenges',
        description: 'Assign weekly challenges to all users',
      },
      {
        slug: 'assign-monthly-challenges',
        description: 'Assign monthly challenges to all users',
      },
      {
        slug: 'expire-challenges',
        description: 'Clean up expired incomplete challenges',
      },
      {
        slug: 'daily-decay',
        description: 'Apply daily decay to user totalSeconds',
      },
    ],
  })
}

