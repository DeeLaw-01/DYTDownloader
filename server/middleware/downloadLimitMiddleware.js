import rateLimit from 'express-rate-limit'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

// Store for tracking anonymous user downloads (in production, use Redis)
const anonymousDownloads = new Map()

// Clean up old entries every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  for (const [ip, timestamp] of anonymousDownloads.entries()) {
    if (timestamp < oneHourAgo) {
      anonymousDownloads.delete(ip)
    }
  }
}, 60 * 60 * 1000)

// Download limit middleware
export const downloadLimitMiddleware = async (req, res, next) => {
  try {
    let token = null
    let user = null

    // Check if user is authenticated
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        user = await User.findById(decoded.userId).select('-password')
      } catch (error) {
        // Token is invalid, treat as anonymous user
        console.log('Invalid token, treating as anonymous user')
      }
    }

    // If user is authenticated, allow unlimited downloads
    if (user) {
      req.user = user
      return next()
    }

    // For anonymous users, check download limit
    // Get client IP with proper proxy handling
    const clientIP =
      req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    // Get current download count for this IP
    const downloadCount = anonymousDownloads.get(clientIP) || 0

    // Check if we need to reset the counter (new hour)
    const lastDownloadTime = anonymousDownloads.get(`${clientIP}_time`) || 0
    if (lastDownloadTime < oneHourAgo) {
      // Reset counter for new hour
      anonymousDownloads.set(clientIP, 0)
      anonymousDownloads.set(`${clientIP}_time`, now)
    }

    // Check if user has exceeded the limit
    if (downloadCount >= 5) {
      return res.status(429).json({
        success: false,
        message:
          'Download limit exceeded. You have used all 5 free downloads. Please login for unlimited downloads.',
        limit: 5,
        used: downloadCount,
        remaining: 0
      })
    }

    // Increment download count
    anonymousDownloads.set(clientIP, downloadCount + 1)
    anonymousDownloads.set(`${clientIP}_time`, now)

    // Add download info to request
    req.downloadInfo = {
      isAnonymous: true,
      downloadsUsed: downloadCount + 1,
      downloadsRemaining: 5 - (downloadCount + 1)
    }

    next()
  } catch (error) {
    console.error('Download limit middleware error:', error)
    // If there's an error, allow the request to proceed
    next()
  }
}

// Rate limiting for anonymous users (additional protection)
export const anonymousRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 downloads per hour for anonymous users
  message: {
    success: false,
    message:
      'Too many download requests. Please login for unlimited downloads.',
    limit: 5,
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: process.env.NODE_ENV === 'production',
  skip: req => {
    // Skip rate limiting for authenticated users
    return (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    )
  }
})

// Rate limiting for authenticated users (prevent abuse)
export const authenticatedRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 downloads per 15 minutes for authenticated users
  message: {
    success: false,
    message: 'Too many download requests. Please slow down.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: process.env.NODE_ENV === 'production',
  skip: req => {
    // Only apply to authenticated users
    return !(
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    )
  }
})
