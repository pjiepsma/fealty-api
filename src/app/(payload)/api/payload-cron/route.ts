import { NextResponse } from 'next/server'
import { runGenerateBlur } from '@/payload/jobs/generate-blur'

/**
 * Validates cron job requests using CRON_SECRET authentication
 * @description Implements Vercel's official cron job security pattern:
 * - Primary: Checks Authorization header for "Bearer {CRON_SECRET}" (production)
 * - Fallback: Checks query parameter "secret" for manual testing
 * Source: https://dev.to/aaronksaunders/run-payload-jobs-on-vercel-serverless-step-by-step-migration-aj9
 */
const isAuthorized = (req: Request): boolean => {
  const configured = process.env.CRON_SECRET || ''
  if (!configured) {
    console.log('[CRON] No CRON_SECRET configured')
    return false
  }

  const authHeader = req.headers.get('authorization') || ''

  // Check if Authorization header matches CRON_SECRET (as per Vercel docs)
  if (authHeader === `Bearer ${configured}`) {
    console.log('[CRON] ✅ Authorized via Authorization header')
    return true
  }

  // Fallback to query param for manual testing
  try {
    const url = new URL(req.url)
    const qsSecret = url.searchParams.get('secret') || ''
    if (qsSecret === configured) {
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

export async function GET(req: Request) {
  console.log('[CRON] 🔔 Processing cron job request')

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[CRON] Authorization successful, running task...')
  const result = await runGenerateBlur()
  console.log('[CRON] ✅ Task completed:', result)
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  console.log('[CRON] 🔔 Processing cron job request (POST)')

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[CRON] Authorization successful, running task...')
  const result = await runGenerateBlur()
  console.log('[CRON] ✅ Task completed:', result)
  return NextResponse.json(result)
}

