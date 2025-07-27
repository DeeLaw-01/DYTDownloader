import express from 'express'
import logService from '../services/logService.js'
import { generalLimiter } from '../middleware/securityMiddleware.js'

const router = express.Router()

// Get logs with filtering (admin only)
router.get('/', generalLimiter, async (req, res) => {
  try {
    const {
      level,
      method,
      statusCode,
      userId,
      startDate,
      endDate,
      limit = 50,
      skip = 0
    } = req.query

    const logs = await logService.getLogs({
      level,
      method,
      statusCode: statusCode ? parseInt(statusCode) : undefined,
      userId,
      startDate,
      endDate,
      limit: parseInt(limit),
      skip: parseInt(skip)
    })

    res.json({
      success: true,
      data: logs,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        total: logs.length
      }
    })
  } catch (error) {
    await logService.error('Error fetching logs', error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs'
    })
  }
})

// Get log statistics
router.get('/stats', generalLimiter, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const stats = await logService.getLogStats(startDate, endDate)

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    await logService.error('Error fetching log stats', error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch log statistics'
    })
  }
})

// Get recent errors
router.get('/errors', generalLimiter, async (req, res) => {
  try {
    const { limit = 20 } = req.query

    const errors = await logService.getLogs({
      level: 'error',
      limit: parseInt(limit)
    })

    res.json({
      success: true,
      data: errors
    })
  } catch (error) {
    await logService.error('Error fetching error logs', error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch error logs'
    })
  }
})

// Get download statistics
router.get('/downloads', generalLimiter, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const filter = {}
    if (startDate || endDate) {
      filter.timestamp = {}
      if (startDate) filter.timestamp.$gte = new Date(startDate)
      if (endDate) filter.timestamp.$lte = new Date(endDate)
    }

    // This would require a more complex aggregation, but for now we'll get all logs
    // and filter on the application level
    const logs = await logService.getLogs({
      startDate,
      endDate,
      limit: 1000
    })

    const downloadLogs = logs.filter(
      log => log.metadata?.format && log.metadata?.videoTitle
    )

    const stats = {
      total: downloadLogs.length,
      mp4: downloadLogs.filter(log => log.metadata.format === 'MP4').length,
      mp3: downloadLogs.filter(log => log.metadata.format === 'MP3').length,
      successful: downloadLogs.filter(log => log.metadata.success).length,
      failed: downloadLogs.filter(log => !log.metadata.success).length
    }

    res.json({
      success: true,
      data: stats,
      recent: downloadLogs.slice(0, 10)
    })
  } catch (error) {
    await logService.error('Error fetching download stats', error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch download statistics'
    })
  }
})

export default router
