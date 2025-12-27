'use client'

import { useState } from 'react'
import { Button } from '@payloadcms/ui'

type JobSlug =
  | 'assign-daily-challenges'
  | 'assign-weekly-challenges'
  | 'assign-monthly-challenges'
  | 'expire-challenges'
  | 'daily-decay'

interface JobInfo {
  slug: JobSlug
  label: string
  description: string
}

const jobs: JobInfo[] = [
  {
    slug: 'assign-daily-challenges',
    label: 'Assign Daily Challenges',
    description: 'Assign daily challenges to all users',
  },
  {
    slug: 'assign-weekly-challenges',
    label: 'Assign Weekly Challenges',
    description: 'Assign weekly challenges to all users',
  },
  {
    slug: 'assign-monthly-challenges',
    label: 'Assign Monthly Challenges',
    description: 'Assign monthly challenges to all users',
  },
  {
    slug: 'expire-challenges',
    label: 'Expire Challenges',
    description: 'Clean up expired incomplete challenges',
  },
  {
    slug: 'daily-decay',
    label: 'Daily Decay',
    description: 'Apply daily decay to user totalSeconds',
  },
]

export default function JobTestButtons() {
  const [loading, setLoading] = useState<Record<JobSlug, boolean>>({
    'assign-daily-challenges': false,
    'assign-weekly-challenges': false,
    'assign-monthly-challenges': false,
    'expire-challenges': false,
    'daily-decay': false,
  })
  const [results, setResults] = useState<Record<JobSlug, string | null>>({
    'assign-daily-challenges': null,
    'assign-weekly-challenges': null,
    'assign-monthly-challenges': null,
    'expire-challenges': null,
    'daily-decay': null,
  })

  const [seedLoading, setSeedLoading] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)

  const executeJob = async (jobSlug: JobSlug) => {
    setLoading((prev) => ({ ...prev, [jobSlug]: true }))
    setResults((prev) => ({ ...prev, [jobSlug]: null }))

    try {
      const response = await fetch('/api/jobs/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobSlug }),
      })

      const data = await response.json()

      if (response.ok) {
        const resultMessage = data.result?.output
          ? JSON.stringify(data.result.output, null, 2)
          : 'Job executed successfully'
        setResults((prev) => ({ ...prev, [jobSlug]: resultMessage }))
      } else {
        setResults((prev) => ({
          ...prev,
          [jobSlug]: `Error: ${data.error || data.message || 'Unknown error'}`,
        }))
      }
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [jobSlug]: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }))
    } finally {
      setLoading((prev) => ({ ...prev, [jobSlug]: false }))
    }
  }

  const seedRewards = async () => {
    setSeedLoading(true)
    setSeedResult(null)

    try {
      const response = await fetch('/api/rewards/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setSeedResult(`Success: ${data.message || 'Rewards seeded successfully'}`)
      } else {
        setSeedResult(`Error: ${data.error || data.message || 'Unknown error'}`)
      }
    } catch (error) {
      setSeedResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSeedLoading(false)
    }
  }

  return (
    <div
      style={{
        padding: '20px',
        margin: '20px 0',
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '4px',
        backgroundColor: 'var(--theme-elevation-50)',
      }}
    >
      <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
        Test Cron Jobs
      </h2>
      <p style={{ marginBottom: '20px', color: 'var(--theme-text)', fontSize: '14px' }}>
        Click a button below to manually trigger a cron job for testing purposes.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {jobs.map((job) => (
          <div
            key={job.slug}
            style={{
              padding: '16px',
              border: '1px solid var(--theme-elevation-200)',
              borderRadius: '4px',
              backgroundColor: 'var(--theme-elevation-0)',
            }}
          >
            <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              {job.label}
            </h3>
            <p
              style={{
                marginBottom: '12px',
                fontSize: '12px',
                color: 'var(--theme-elevation-500)',
              }}
            >
              {job.description}
            </p>
            <Button
              onClick={() => executeJob(job.slug)}
              disabled={loading[job.slug]}
              style={{ width: '100%' }}
            >
              {loading[job.slug] ? 'Running...' : 'Run Job'}
            </Button>
            {results[job.slug] && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '8px',
                  backgroundColor: 'var(--theme-elevation-100)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '150px',
                  overflow: 'auto',
                }}
              >
                {results[job.slug]}
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          border: '1px solid var(--theme-elevation-200)',
          borderRadius: '4px',
          backgroundColor: 'var(--theme-elevation-0)',
        }}
      >
        <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
          Seed Rewards
        </h3>
        <p
          style={{
            marginBottom: '12px',
            fontSize: '12px',
            color: 'var(--theme-elevation-500)',
          }}
        >
          Create default rewards for difficulty levels 1-9 (idempotent - safe to run multiple times)
        </p>
        <Button onClick={seedRewards} disabled={seedLoading} style={{ width: '100%' }}>
          {seedLoading ? 'Seeding...' : 'Seed Rewards'}
        </Button>
        {seedResult && (
          <div
            style={{
              marginTop: '12px',
              padding: '8px',
              backgroundColor: 'var(--theme-elevation-100)',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {seedResult}
          </div>
        )}
      </div>
    </div>
  )
}

