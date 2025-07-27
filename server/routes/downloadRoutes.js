import express from 'express'
import {
  downloadMP4,
  downloadMP3,
  getVideoInfo
} from '../controllers/downloadController.js'
import {
  downloadSpeedLimiter,
  validateYouTubeUrl,
  validateQuality,
  handleValidationErrors,
  requestSizeLimiter
} from '../middleware/securityMiddleware.js'
import {
  downloadLimitMiddleware,
  anonymousRateLimiter,
  authenticatedRateLimiter
} from '../middleware/downloadLimitMiddleware.js'

const router = express.Router()

// Get video information
router.post(
  '/info',
  downloadLimitMiddleware,
  anonymousRateLimiter,
  authenticatedRateLimiter,
  requestSizeLimiter,
  validateYouTubeUrl,
  handleValidationErrors,
  getVideoInfo
)

// Download as MP4
router.post(
  '/mp4',
  downloadLimitMiddleware,
  anonymousRateLimiter,
  authenticatedRateLimiter,
  downloadSpeedLimiter,
  requestSizeLimiter,
  validateYouTubeUrl,
  validateQuality,
  handleValidationErrors,
  downloadMP4
)

// Download as MP3
router.post(
  '/mp3',
  downloadLimitMiddleware,
  anonymousRateLimiter,
  authenticatedRateLimiter,
  downloadSpeedLimiter,
  requestSizeLimiter,
  validateYouTubeUrl,
  validateQuality,
  handleValidationErrors,
  downloadMP3
)

export default router
