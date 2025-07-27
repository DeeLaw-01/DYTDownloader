import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import helmet from 'helmet'
import { body, validationResult } from 'express-validator'

// Rate limiting for general API endpoints
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Stricter rate limiting for download endpoints
export const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 download requests per windowMs
  message: {
    error: 'Too many download requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Speed limiting for download endpoints (slows down requests)
export const downloadSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // allow 5 requests per 15 minutes, then...
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit
    return (used - delayAfter) * 500
  },
  maxDelayMs: 20000 // maximum delay of 20 seconds
})

// YouTube URL validation
export const validateYouTubeUrl = [
  body('url')
    .trim()
    .notEmpty()
    .withMessage('URL is required')
    .isURL()
    .withMessage('Invalid URL format')
    .custom(value => {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
      if (!youtubeRegex.test(value)) {
        throw new Error('URL must be a valid YouTube URL')
      }
      return true
    })
    .customSanitizer(value => {
      // Remove any extra whitespace and normalize
      return value.trim()
    })
]

// Quality validation for download requests
export const validateQuality = [
  body('quality')
    .optional()
    .isIn([
      'highest',
      'lowest',
      'highestvideo',
      'lowestvideo',
      'highestaudio',
      'lowestaudio'
    ])
    .withMessage('Invalid quality option')
]

// Validation result handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    })
  }
  next()
}

// Request size limiter
export const requestSizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0')
  const maxSize = 1024 * 1024 // 1MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large',
      maxSize: '1MB'
    })
  }

  next()
}

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  frameguard: { action: 'deny' }
})

// CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://yourdomain.com', // Replace with your actual domain
      'https://www.yourdomain.com'
    ]

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}

import logService from '../services/logService.js'

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    // Log to database
    logService.logRequest(req, res, duration)
  })

  next()
}

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  // Log error to database
  logService.error('Application error', err, req)

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    })
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value'
    })
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message
  })
}

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
}
