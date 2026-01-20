import type { Payload } from 'payload'

type LogLevel = 'info' | 'warning' | 'error' | 'success'
type JobType =
  | 'assign-daily-challenges'
  | 'assign-weekly-challenges'
  | 'assign-monthly-challenges'
  | 'expire-challenges'
  | 'daily-decay'
  | 'calculate-king-status'
  | 'expire-old-rewards'
  | 'expire-season-rewards'
  | 'cron-job'
  | 'other'

export async function log(
  payload: Payload,
  level: LogLevel,
  job: JobType,
  message: string,
  data?: Record<string, unknown>,
  error?: string,
): Promise<void> {
  try {
    await payload.create({
      collection: 'logs',
      data: {
        timestamp: new Date().toISOString(),
        level,
        job,
        message,
        data: data || undefined,
        error,
      },
      draft: false,
    })
  } catch (err) {
    // Don't throw if logging fails - just log to console
    console.error('Failed to write log entry:', err)
  }
}
