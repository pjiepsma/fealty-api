import { NextRequest, NextResponse } from 'next/server'
import { runAssignDailyChallenges } from '@/jobs/assignDailyChallengesJobRunner'
import { runAssignWeeklyChallenges } from '@/jobs/assignWeeklyChallengesJobRunner'
import { runAssignMonthlyChallenges } from '@/jobs/assignMonthlyChallengesJobRunner'
import { runExpireChallenges } from '@/jobs/expireChallengesJobRunner'
import { runDailyDecay } from '@/jobs/dailyDecayJobRunner'

type JobSlug =
  | 'assign-daily-challenges'
  | 'assign-weekly-challenges'
  | 'assign-monthly-challenges'
  | 'expire-challenges'
  | 'daily-decay'

type JobRunner = () => Promise<{ output?: unknown; state?: string; errorMessage?: string }>

const jobRunners: Record<JobSlug, JobRunner> = {
  'assign-daily-challenges': async () => {
    const result = await runAssignDailyChallenges()
    return { output: result.output }
  },
  'assign-weekly-challenges': async () => {
    const result = await runAssignWeeklyChallenges()
    return { output: result.output }
  },
  'assign-monthly-challenges': async () => {
    const result = await runAssignMonthlyChallenges()
    return { output: result.output }
  },
  'expire-challenges': async () => {
    const result = await runExpireChallenges()
    return { output: result }
  },
  'daily-decay': async () => {
    const result = await runDailyDecay()
    return { output: result }
  },
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

    const isValidJobSlug = (slug: string): slug is JobSlug => {
      return (
        slug === 'assign-daily-challenges' ||
        slug === 'assign-weekly-challenges' ||
        slug === 'assign-monthly-challenges' ||
        slug === 'expire-challenges' ||
        slug === 'daily-decay'
      )
    }

    if (!isValidJobSlug(jobSlug)) {
      return NextResponse.json(
        {
          error: `Invalid jobSlug. Must be one of: ${validJobSlugs.join(', ')}`,
        },
        { status: 400 },
      )
    }

    const runner = jobRunners[jobSlug]

    if (!runner) {
      return NextResponse.json(
        {
          error: `Runner not found for job: ${jobSlug}`,
        },
        { status: 404 },
      )
    }

    const result = await runner()

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
