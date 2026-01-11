import { NextRequest, NextResponse } from 'next/server'
<<<<<<< HEAD
import {
  assignDailyChallengesTask,
  assignWeeklyChallengesTask,
  assignMonthlyChallengesTask,
} from '@/jobs/assignChallengesJob'
import { expireChallengesTask } from '@/jobs/expireChallengesJob'
import { dailyDecayTask } from '@/jobs/dailyDecayJob'
import type { PayloadRequest } from 'payload'
=======
import { runAssignDailyChallenges } from '@/jobs/assignDailyChallengesJobRunner'
import { runAssignWeeklyChallenges } from '@/jobs/assignWeeklyChallengesJobRunner'
import { runAssignMonthlyChallenges } from '@/jobs/assignMonthlyChallengesJobRunner'
import { runExpireChallenges } from '@/jobs/expireChallengesJobRunner'
import { runDailyDecay } from '@/jobs/dailyDecayJobRunner'
import { runPulse } from '@/jobs/pulseJob'
>>>>>>> b331cb0b5995a1c81e5d01eca51f795f5c1f445a

type JobSlug =
  | 'assign-daily-challenges'
  | 'assign-weekly-challenges'
  | 'assign-monthly-challenges'
  | 'expire-challenges'
  | 'daily-decay'

<<<<<<< HEAD
type TaskHandler = {
  slug: string
  handler: (args: {
    req: PayloadRequest
  }) => Promise<{ output?: unknown; state?: string; errorMessage?: string }>
}

const jobHandlers: Record<JobSlug, TaskHandler> = {
  'assign-daily-challenges': assignDailyChallengesTask,
  'assign-weekly-challenges': assignWeeklyChallengesTask,
  'assign-monthly-challenges': assignMonthlyChallengesTask,
  'expire-challenges': expireChallengesTask,
  'daily-decay': dailyDecayTask,
=======
const jobHandlers: Record<JobSlug, () => Promise<unknown>> = {
  'pulse': runPulse,
  'assign-daily-challenges': runAssignDailyChallenges,
  'assign-weekly-challenges': runAssignWeeklyChallenges,
  'assign-monthly-challenges': runAssignMonthlyChallenges,
  'expire-challenges': runExpireChallenges,
  'daily-decay': runDailyDecay,
>>>>>>> b331cb0b5995a1c81e5d01eca51f795f5c1f445a
}

export async function POST(request: NextRequest) {
  try {
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

<<<<<<< HEAD
    // Get the task config for this job
    const taskConfig = jobHandlers[jobSlug as JobSlug]

    if (!taskConfig) {
=======
    // Get the job runner function
    const jobRunner = jobHandlers[jobSlug as JobSlug]

    if (!jobRunner) {
>>>>>>> b331cb0b5995a1c81e5d01eca51f795f5c1f445a
      return NextResponse.json(
        {
          error: `Handler not found for job: ${jobSlug}`,
        },
        { status: 404 },
      )
    }

<<<<<<< HEAD
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

    const result = await handler({
      req: mockReq,
    })
=======
    // Execute the job runner directly
    const result = await jobRunner()
>>>>>>> b331cb0b5995a1c81e5d01eca51f795f5c1f445a

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
