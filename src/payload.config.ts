import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { POIs } from './collections/POIs'
import { Sessions } from './collections/Sessions'
import { Rewards } from './collections/Rewards'
import { Challenges } from './collections/Challenges'
import { getSelectedEmailAdapter } from './lib/email-adapters/selectEmailAdapter'
import { ChallengeConfig } from './globals/ChallengeConfig/challengeConfig'
import { GameConfig } from './globals/GameConfig/gameConfig'
import { Mail } from './globals/Mail/mail'
import {
  assignDailyChallengesTask,
  assignWeeklyChallengesTask,
  assignMonthlyChallengesTask,
} from './jobs/assignChallengesJob'
import { expireChallengesTask } from './jobs/expireChallengesJob'
import { dailyDecayTask } from './jobs/dailyDecayJob'
import { expireOldRewardsTask } from './jobs/expireOldRewardsJob'
import { expireSeasonRewardsTask } from './jobs/expireSeasonRewardsJob'
import { calculateKingStatusTask } from './jobs/calculateKingStatusJob'
import { pulseTask } from './jobs/pulseJob'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeDashboard: ['/components/JobTestButtons'],
    },
  },
  collections: [Users, Media, POIs, Sessions, Rewards, Challenges],
  globals: [ChallengeConfig, GameConfig, Mail],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL:
    process.env.PAYLOAD_SERVER_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
  }),
  ...(process.env.PAYLOAD_PUBLIC_CORS_CSRF_URLS && {
    cors: process.env.PAYLOAD_PUBLIC_CORS_CSRF_URLS.split(','),
    csrf: process.env.PAYLOAD_PUBLIC_CORS_CSRF_URLS.split(','),
  }),
  sharp,
  email: getSelectedEmailAdapter(),
  jobs: {
    tasks: [
      {
        ...assignDailyChallengesTask,
        schedule: [
          {
            cron: '0 0 * * *', // Every day at 00:00 UTC
            queue: 'default',
          },
        ],
      },
      {
        ...assignWeeklyChallengesTask,
        schedule: [
          {
            cron: '0 0 * * 1', // Every Monday at 00:00 UTC
            queue: 'default',
          },
        ],
      },
      {
        ...assignMonthlyChallengesTask,
        schedule: [
          {
            cron: '0 0 1 * *', // 1st of every month at 00:00 UTC
            queue: 'default',
          },
        ],
      },
      {
        ...expireChallengesTask,
        schedule: [
          {
            cron: '0 1 * * *', // Every day at 01:00 UTC (after challenge assignment)
            queue: 'default',
          },
        ],
      },
      {
        ...dailyDecayTask,
        schedule: [
          {
            cron: '0 0 * * *', // Every day at 00:00 UTC
            queue: 'default',
          },
        ],
      },
      {
        ...expireOldRewardsTask,
        schedule: [
          {
            cron: '0 2 * * *', // Every day at 02:00 UTC (after daily_decay at 00:00)
            queue: 'default',
          },
        ],
      },
      {
        ...expireSeasonRewardsTask,
        schedule: [
          {
            cron: '30 1 1 * *', // 1st of every month at 01:30 UTC (after challenge cleanup at 01:00)
            queue: 'default',
          },
        ],
      },
      {
        ...calculateKingStatusTask,
        schedule: [
          {
            cron: '30 0 * * *', // Every day at 00:30 UTC (after daily decay at 00:00)
            queue: 'default',
          },
        ],
      },
      {
        ...pulseTask,
        schedule: [
          {
            cron: '0 * * * *', // Every hour at minute 0
            queue: 'default',
          },
        ],
      },
    ],
  },
  plugins: [],
})
