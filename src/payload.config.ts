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
import { Mail } from './globals/Mail/mail'
import {
  assignDailyChallengesTask,
  assignWeeklyChallengesTask,
  assignMonthlyChallengesTask,
} from './jobs/assignChallengesJob'
import { expireChallengesTask } from './jobs/expireChallengesJob'
import { dailyDecayTask } from './jobs/dailyDecayJob'

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
  collections: [
    Users,
    Media,
    POIs,
    Sessions,
    Rewards,
    Challenges,
  ],
  globals: [ChallengeConfig, Mail],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.PAYLOAD_SERVER_URL,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || process.env.DATABASE_URL || '',
  }),
  cors: process.env.PAYLOAD_PUBLIC_CORS_CSRF_URLS?.split(',').filter((url): url is string => typeof url === 'string' && url.length > 0) || ['*'],
  csrf: process.env.PAYLOAD_PUBLIC_CORS_CSRF_URLS?.split(',').filter((url): url is string => typeof url === 'string' && url.length > 0) || ['*'],
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
    ],
  },
  plugins: [],
})

