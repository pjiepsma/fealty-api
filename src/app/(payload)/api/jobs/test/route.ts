import { NextRequest, NextResponse } from 'next/server'
import { runAssignDailyChallenges } from '@/jobs/assignDailyChallengesJobRunner'
import { runAssignWeeklyChallenges } from '@/jobs/assignWeeklyChallengesJobRunner'
import { runAssignMonthlyChallenges } from '@/jobs/assignMonthlyChallengesJobRunner'
import { runExpireChallenges } from '@/jobs/expireChallengesJobRunner'
import { runDailyDecay } from '@/jobs/dailyDecayJobRunner'
import { runPulse } from '@/jobs/pulseJob'

type JobSlug =
  | 'pulse'
  | 'assign-daily-challenges'
  | 'assign-weekly-challenges'
  | 'assign-monthly-challenges'
  | 'expire-challenges'
  | 'daily-decay'

const jobHandlers: Record<JobSlug, () => Promise<unknown>> = {
  'pulse': runPulse,
  'assign-daily-challenges': runAssignDailyChallenges,
  'assign-weekly-challenges': runAssignWeeklyChallenges,
  'assign-monthly-challenges': runAssignMonthlyChallenges,
  'expire-challenges': runExpireChallenges,
  'daily-decay': runDailyDecay,
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

    // Get the job runner function
    const jobRunner = jobHandlers[jobSlug as JobSlug]

    if (!jobRunner) {
      return NextResponse.json(
        {
          error: `Handler not found for job: ${jobSlug}`,
        },
        { status: 404 },
      )
    }

    // Execute the job runner directly
    const result = await jobRunner()

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
        description: 'Simple pulse job that logs success (runs daily)',
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

