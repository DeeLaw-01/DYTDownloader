import Log from '../models/Log.js'
import { config } from '../config/environment.js'

class LogService {
  constructor () {
    this.isProduction = config.NODE_ENV === 'production'
  }

  // Get client IP address
  getClientIP (req) {
    return (
      req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
      'unknown'
    )
  }

  // Get user ID from request (if authenticated)
  getUserId (req) {
    return req.user?._id || null
  }

  // Create log entry
  async createLog (data) {
    try {
      const log = new Log(data)
      await log.save()

      // Also log to console in development
      if (!this.isProduction) {
        const timestamp = new Date().toISOString()
        const level = data.level.toUpperCase()
        console.log(`[${timestamp}] ${level}: ${data.message}`)
      }

      return log
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Logging to database failed:', error)
      console.log(
        `[${new Date().toISOString()}] ${data.level.toUpperCase()}: ${
          data.message
        }`
      )
    }
  }

  // Info level logging
  async info (message, req = null, metadata = {}) {
    return this.createLog({
      level: 'info',
      message,
      method: req?.method,
      url: req?.originalUrl,
      ip: req ? this.getClientIP(req) : null,
      userAgent: req?.headers['user-agent'],
      userId: req ? this.getUserId(req) : null,
      metadata
    })
  }

  // Warning level logging
  async warn (message, req = null, metadata = {}) {
    return this.createLog({
      level: 'warn',
      message,
      method: req?.method,
      url: req?.originalUrl,
      ip: req ? this.getClientIP(req) : null,
      userAgent: req?.headers['user-agent'],
      userId: req ? this.getUserId(req) : null,
      metadata
    })
  }

  // Error level logging
  async error (message, error = null, req = null, metadata = {}) {
    return this.createLog({
      level: 'error',
      message,
      method: req?.method,
      url: req?.originalUrl,
      ip: req ? this.getClientIP(req) : null,
      userAgent: req?.headers['user-agent'],
      userId: req ? this.getUserId(req) : null,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: this.isProduction ? undefined : error.stack
          }
        : null,
      metadata
    })
  }

  // Debug level logging (only in development)
  async debug (message, req = null, metadata = {}) {
    if (!this.isProduction) {
      return this.createLog({
        level: 'debug',
        message,
        method: req?.method,
        url: req?.originalUrl,
        ip: req ? this.getClientIP(req) : null,
        userAgent: req?.headers['user-agent'],
        userId: req ? this.getUserId(req) : null,
        metadata
      })
    }
  }

  // Request logging
  async logRequest (req, res, responseTime) {
    const statusCode = res.statusCode
    const level = statusCode >= 400 ? 'warn' : 'info'

    const message = `${req.method} ${req.originalUrl} ${statusCode} ${responseTime}ms`

    return this.createLog({
      level,
      message,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      responseTime,
      ip: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      userId: this.getUserId(req)
    })
  }

  // Download logging
  async logDownload (req, videoInfo, format, success = true) {
    const message = `Download ${format} ${success ? 'started' : 'failed'}: ${
      videoInfo?.title || 'Unknown'
    }`

    return this.createLog({
      level: success ? 'info' : 'error',
      message,
      method: req.method,
      url: req.originalUrl,
      ip: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      userId: this.getUserId(req),
      action: 'download',
      metadata: {
        videoTitle: videoInfo?.title,
        videoDuration: videoInfo?.duration,
        format,
        success
      }
    })
  }

  // Rate limit logging
  async logRateLimit (req, limit, windowMs) {
    return this.createLog({
      level: 'warn',
      message: `Rate limit exceeded: ${req.ip} - ${limit} requests per ${windowMs}ms`,
      method: req.method,
      url: req.originalUrl,
      ip: this.getClientIP(req),
      userAgent: req.headers['user-agent'],
      metadata: {
        limit,
        windowMs,
        type: 'rate_limit'
      }
    })
  }

  // Get logs with filtering
  async getLogs (options = {}) {
    const {
      level,
      method,
      statusCode,
      userId,
      startDate,
      endDate,
      limit = 100,
      skip = 0
    } = options

    const filter = {}

    if (level) filter.level = level
    if (method) filter.method = method
    if (statusCode) filter.statusCode = statusCode
    if (userId) filter.userId = userId
    if (startDate || endDate) {
      filter.timestamp = {}
      if (startDate) filter.timestamp.$gte = new Date(startDate)
      if (endDate) filter.timestamp.$lte = new Date(endDate)
    }

    return Log.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'name email')
  }

  // Get log statistics
  async getLogStats (startDate = null, endDate = null) {
    const filter = {}
    if (startDate || endDate) {
      filter.timestamp = {}
      if (startDate) filter.timestamp.$gte = new Date(startDate)
      if (endDate) filter.timestamp.$lte = new Date(endDate)
    }

    const stats = await Log.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          errors: { $sum: { $cond: [{ $eq: ['$level', 'error'] }, 1, 0] } },
          warnings: { $sum: { $cond: [{ $eq: ['$level', 'warn'] }, 1, 0] } },
          info: { $sum: { $cond: [{ $eq: ['$level', 'info'] }, 1, 0] } },
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ])

    return (
      stats[0] || {
        total: 0,
        errors: 0,
        warnings: 0,
        info: 0,
        avgResponseTime: 0
      }
    )
  }
}

// Create singleton instance
const logService = new LogService()

export default logService
