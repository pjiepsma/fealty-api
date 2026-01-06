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
import { generateBlurHandler } from '@/payload/jobs/generate-blur'

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
    /**
     * Conditionally enable autoRun based on environment
     * @description Serverless environments (e.g., Vercel) should disable in-process schedulers.
     * Set ENABLE_PAYLOAD_AUTORUN="true" locally or on traditional servers to turn this on.
     * Source: https://dev.to/aaronksaunders/run-payload-jobs-on-vercel-serverless-step-by-step-migration-aj9
     */
    autoRun:
      process.env.ENABLE_PAYLOAD_AUTORUN === 'true'
        ? [
            {
              cron: '0 0 * * *', // Process jobs daily
              queue: 'default',
            },
          ]
        : [],
    access: {
      run: ({ req }) => {
        if (req.user) return true

        const authHeader = req.headers.get('authorization')
        if (!process.env.CRON_SECRET) {
          console.warn('CRON_SECRET environment variable is not set')
          return false
        }
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
      queue: () => true,
      cancel: () => true,
    },
    jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
      ...defaultJobsCollection,
      access: {
        ...defaultJobsCollection.access,
        read: ({ req }) => !!req.user,
        create: ({ req }) => !!req.user,
        update: ({ req }) => !!req.user,
        delete: ({ req }) => !!req.user,
      },
      admin: {
        hidden: false, // Keep jobs visible in Admin
      },
    }),
    tasks: [
      {
        slug: 'generate-blur',
        /**
         * Conditionally attach schedule when ENABLE_PAYLOAD_TASK_SCHEDULE === 'true'
         * @description On serverless, keep this empty and rely on Vercel Cron hitting an API route.
         */
        schedule:
          process.env.ENABLE_PAYLOAD_TASK_SCHEDULE === 'true'
            ? [
                {
                  cron: '0 0 * * *', // Run daily
                  queue: 'default',
                },
              ]
            : [],
        handler: generateBlurHandler,
      },
    ],
  },
  plugins: [],
})
