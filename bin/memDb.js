import { MongoMemoryServer } from 'mongodb-memory-server'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

// get dir of the current file
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const storageDir = path.resolve(__dirname, './storage')

// Only clean storage if CLEAN_DB env var is set
// This prevents issues with locked files on restart
if (process.env.CLEAN_DB === 'true' && fs.existsSync(storageDir)) {
  try {
    console.log('Cleaning MongoDB storage directory...')
    fs.rmSync(storageDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 })
    console.log('Storage directory cleaned')
  } catch (error) {
    console.warn('Warning: Failed to clean storage directory:', error.message)
    console.warn('Attempting to start MongoDB anyway (will reuse existing data)')
  }
}

fs.mkdirSync(storageDir, { recursive: true })

async function startMongoServer() {
  try {
    console.log('Starting MongoDB Memory Server...')
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'payload',
        dbPath: storageDir,
        storageEngine: 'wiredTiger',
      },
    })
    const mongoUri = mongoServer.getUri()
    console.log('✓ MongoDB started successfully')
    console.log('MongoDB URI:', mongoUri)
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down MongoDB...')
      await mongoServer.stop()
      process.exit(0)
    })
  } catch (error) {
    console.error('Failed to start MongoDB:', error.message)
    console.error('Tip: If you see lock errors, kill all node processes and try again:')
    console.error('  Windows: taskkill /F /IM node.exe')
    console.error('  Mac/Linux: killall node')
    process.exit(1)
  }
}

startMongoServer()







