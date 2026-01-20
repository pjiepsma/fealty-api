import type { CollectionConfig } from 'payload'

export const Logs: CollectionConfig = {
  slug: 'logs',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['timestamp', 'level', 'job', 'message'],
    description: 'System logs for cron jobs and operations',
  },
  fields: [
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      admin: {
        description: 'When this log entry was created',
      },
    },
    {
      name: 'level',
      type: 'select',
      required: true,
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
        { label: 'Error', value: 'error' },
        { label: 'Success', value: 'success' },
      ],
      defaultValue: 'info',
      admin: {
        description: 'Log level',
      },
    },
    {
      name: 'job',
      type: 'select',
      options: [
        { label: 'Daily Challenges', value: 'assign-daily-challenges' },
        { label: 'Weekly Challenges', value: 'assign-weekly-challenges' },
        { label: 'Monthly Challenges', value: 'assign-monthly-challenges' },
        { label: 'Expire Challenges', value: 'expire-challenges' },
        { label: 'Daily Decay', value: 'daily-decay' },
        { label: 'Calculate King Status', value: 'calculate-king-status' },
        { label: 'Expire Old Rewards', value: 'expire-old-rewards' },
        { label: 'Expire Season Rewards', value: 'expire-season-rewards' },
        { label: 'Cron Job', value: 'cron-job' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Which job/system this log is from',
      },
    },
    {
      name: 'message',
      type: 'text',
      required: true,
      admin: {
        description: 'Log message',
      },
    },
    {
      name: 'data',
      type: 'json',
      admin: {
        description: 'Additional data/context (JSON)',
      },
    },
    {
      name: 'error',
      type: 'textarea',
      admin: {
        description: 'Error message or stack trace',
      },
    },
  ],
  timestamps: true,
  indexes: [
    {
      fields: ['timestamp'],
    },
    {
      fields: ['level'],
    },
    {
      fields: ['job'],
    },
    {
      fields: ['timestamp', 'job'],
    },
  ],
  access: {
    read: () => true,
    create: () => true,
    update: () => false,
    delete: ({ req: { user } }) => {
      // Allow admins to delete logs
      return user?.role === 'admin'
    },
  },
}
