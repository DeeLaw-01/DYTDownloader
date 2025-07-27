import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 4000,

  // Database
  MONGO_URI: process.env.MONGO_URI,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Email
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,

  // Security
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000'
  ],

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  DOWNLOAD_RATE_LIMIT_MAX: 10,

  // Download Limits
  MAX_VIDEO_DURATION: 7200, // 2 hours in seconds
  DOWNLOAD_TIMEOUT: 300000, // 5 minutes in milliseconds

  // Request Limits
  MAX_REQUEST_SIZE: '1mb',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Vercel specific
  VERCEL_ENV: process.env.VERCEL_ENV || 'development'
}

// Validate required environment variables
export const validateEnv = () => {
  const required = ['MONGO_URI', 'JWT_SECRET']
  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}

// Production checks
export const isProduction = () => config.NODE_ENV === 'production'
export const isDevelopment = () => config.NODE_ENV === 'development'
export const isTest = () => config.NODE_ENV === 'test'
