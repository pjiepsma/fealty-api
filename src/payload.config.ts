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
    access: {
      run: ({ req }) => {
        console.log('🔍 /api/payload-jobs/run accessed')
        
        // Allow logged-in users to execute this endpoint
        if (req.user) {
          console.log('✅ Authenticated via user session')
          return true
        }

        // Check for Vercel Cron secret
        // Source: https://buildwithmatija.com/payload/payload-jobs-vercel
        const authHeader = req.headers.get('authorization')
        console.log('🔍 Auth header:', authHeader ? `${authHeader.substring(0, 30)}...` : 'NONE')
        console.log('🔍 CRON_SECRET exists:', !!process.env.CRON_SECRET)
        
        if (!process.env.CRON_SECRET) {
          console.warn('❌ CRON_SECRET not set')
          return false
        }
        
        const isAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}`
        console.log('🔐 Auth result:', isAuthorized ? 'PASS' : 'FAIL')
        return isAuthorized
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
    }),
    tasks: [
      {
        slug: 'generate-blur',
        inputSchema: [
          { name: 'docId', type: 'text', required: true },
          { name: 'collection', type: 'text', required: true },
        ],
        outputSchema: [{ name: 'message', type: 'text', required: true }],
        handler: generateBlurHandler,
        retries: 1,
      },
    ],
  },
  plugins: [],
})
