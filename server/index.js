import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import downloadRoutes from './routes/downloadRoutes.js'
import logRoutes from './routes/logRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import {
  generalLimiter,
  securityHeaders,
  corsOptions,
  requestLogger,
  errorHandler,
  notFoundHandler
} from './middleware/securityMiddleware.js'
import { config, validateEnv, isProduction } from './config/environment.js'

// Set environment variables for third-party libraries
if (isProduction) {
  process.env.YTDL_NO_UPDATE = 'true' // Disable YTDL update checks in production
}

// Validate environment variables
try {
  validateEnv()
} catch (error) {
  console.error('❌ Environment validation failed:', error.message)
  process.exit(1)
}

const app = express()

// Trust proxy setting for production deployment
if (isProduction) {
  if (config.DEPLOYMENT_PLATFORM === 'vercel') {
    app.set('trust proxy', 1) // Trust first proxy (Vercel)
    console.log('🔧 Trust proxy enabled for Vercel')
  } else {
    app.set('trust proxy', false) // Direct server (Digital Ocean, etc.)
    console.log('🔧 Trust proxy disabled for direct server')
  }
} else {
  app.set('trust proxy', false) // Local development
  console.log('🔧 Trust proxy disabled for development')
}

// Security middleware (order matters!)
app.use(securityHeaders)
app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Request logging
app.use(requestLogger)

// General rate limiting for all routes
app.use(generalLimiter)

mongoose.set('strictQuery', false)
mongoose.connect(config.MONGO_URI)

const db = mongoose.connection

db.once('open', () => {
  console.log('✅ MongoDB connected')
})

db.on('error', error => {
  console.error('❌ MongoDB error:', error)
})

db.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected')
})

// ROUTES
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/download', downloadRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/admin', adminRoutes)

// Health check endpoint
app.get('/', (_, res) => {
  res.json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// 404 handler (must be after all routes)
app.use(notFoundHandler)

// Error handler (must be last)
app.use(errorHandler)

const PORT = config.PORT
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`🌍 Environment: ${config.NODE_ENV}`)
  console.log(
    `🔒 Security measures: ${
      isProduction() ? 'Production mode' : 'Development mode'
    }`
  )
})
