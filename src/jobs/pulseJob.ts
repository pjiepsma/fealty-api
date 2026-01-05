import type { TaskConfig } from 'payload'

/**
 * Simple pulse job that logs success - runs daily to verify cron is working (Vercel Hobby plan limit)
 */
export const pulseTask: TaskConfig = {
  slug: 'pulse' as any,
  handler: async () => {
    console.log(`🫀 Pulse job executed successfully at ${new Date().toISOString()}`)

    return {
      output: {
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Pulse job completed successfully',
      },
    }
  },
}
