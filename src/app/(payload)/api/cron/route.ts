import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: Request) {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')

  // Verify the request is from Vercel Cron
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    
    // Initialize Payload instance - this will trigger job processing
    // when ENABLE_PAYLOAD_AUTORUN=true, Payload automatically processes scheduled jobs
    // The cron endpoint ensures the serverless function is warm and jobs can run
    
    return Response.json({ 
      success: true, 
      message: 'Cron endpoint triggered - Payload jobs will process if scheduled',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return Response.json(
      { 
        error: 'Cron job failed', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

