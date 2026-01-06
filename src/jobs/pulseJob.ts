/**
 * Simple pulse job that logs success - runs daily to verify cron is working (Vercel Hobby plan limit)
 */
export const runPulse = async () => {
  console.log(`🫀 Pulse job executed successfully at ${new Date().toISOString()}`)

  return {
    success: true,
    timestamp: new Date().toISOString(),
    message: 'Pulse job completed successfully',
  }
}
