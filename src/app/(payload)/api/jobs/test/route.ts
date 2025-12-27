import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { assignDailyChallengesTask, assignWeeklyChallengesTask, assignMonthlyChallengesTask } from '@/jobs/assignChallengesJob'
import { expireChallengesTask } from '@/jobs/expireChallengesJob'
import { dailyDecayTask } from '@/jobs/dailyDecayJob'
import type { PayloadRequest } from 'payload'

type JobSlug =
  | 'assign-daily-challenges'
  | 'assign-weekly-challenges'
  | 'assign-monthly-challenges'
  | 'expire-challenges'
  | 'daily-decay'

const jobHandlers: Record<JobSlug, typeof assignDailyChallengesTask> = {
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

    // Create a proper PayloadRequest object
    const mockReq = {
      payload,
      user: null, // Jobs run as system/admin
      context: {},
      headers: new Headers(),
      i18n: payload.i18n,
      locale: payload.i18n?.defaultLocale || 'en',
      t: payload.i18n?.t || ((key: string) => key),
    } as PayloadRequest

    // Get the handler for this job
    const taskConfig = jobHandlers[jobSlug as JobSlug]
    
    if (!taskConfig || !taskConfig.handler) {
      return NextResponse.json(
        {
          error: `Handler not found for job: ${jobSlug}`,
        },
        { status: 404 },
      )
    }

    // Execute the job handler directly
    const result = await taskConfig.handler({
      req: mockReq,
      input: {},
      id: `test-${Date.now()}`,
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

