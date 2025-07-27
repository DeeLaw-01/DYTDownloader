import ytdl from '@distube/ytdl-core'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import logService from '../services/logService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, '../downloads')
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true })
}

// Get video information
export const getVideoInfo = async (req, res) => {
  try {
    const { url } = req.body

    // Additional security check
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid URL is required'
      })
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL'
      })
    }

    // Check video length (prevent abuse with very long videos)
    const info = await ytdl.getInfo(url)
    const duration = parseInt(info.videoDetails.lengthSeconds)

    if (duration > 7200) {
      // 2 hours max
      return res.status(400).json({
        success: false,
        message: 'Video is too long. Maximum duration is 2 hours.'
      })
    }

    // Check if video is age-restricted or private
    if (info.videoDetails.isPrivate || info.videoDetails.isLiveContent) {
      return res.status(400).json({
        success: false,
        message: 'This video is not available for download'
      })
    }

    const videoInfo = {
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails[0]?.url,
      author: info.videoDetails.author.name,
      viewCount: info.videoDetails.viewCount,
      formats: info.formats.slice(0, 10).map(format => ({
        // Limit to 10 formats
        itag: format.itag,
        quality: format.qualityLabel,
        container: format.container,
        hasAudio: format.hasAudio,
        hasVideo: format.hasVideo
      }))
    }

    // Log successful video info request
    await logService.info('Video info retrieved successfully', req, {
      videoTitle: videoInfo.title,
      videoDuration: videoInfo.duration
    })

    res.json({
      success: true,
      data: videoInfo
    })
  } catch (error) {
    console.log('Get video info error: ', error)
    // Log error
    await logService.error('Get video info error', error, req, {
      url: req.body.url
    })

    // Handle specific YouTube errors
    if (error.message.includes('Video unavailable')) {
      return res.status(400).json({
        success: false,
        message: 'This video is not available'
      })
    }

    if (error.message.includes('Sign in')) {
      return res.status(400).json({
        success: false,
        message: 'This video requires authentication'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get video information',
      error:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message
    })
  }
}

// Download as MP4
export const downloadMP4 = async (req, res) => {
  try {
    const { url, quality = 'highest' } = req.body

    // Additional security check
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid URL is required'
      })
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL'
      })
    }

    // Get video info and validate
    const info = await ytdl.getInfo(url)
    const duration = parseInt(info.videoDetails.lengthSeconds)

    if (duration > 7200) {
      // 2 hours max
      return res.status(400).json({
        success: false,
        message: 'Video is too long. Maximum duration is 2 hours.'
      })
    }

    if (info.videoDetails.isPrivate || info.videoDetails.isLiveContent) {
      return res.status(400).json({
        success: false,
        message: 'This video is not available for download'
      })
    }

    const videoTitle = info.videoDetails.title
      .replace(/[^\w\s]/gi, '')
      .substring(0, 50)
    const timestamp = Date.now()
    const fileName = `${videoTitle}_${timestamp}.mp4`

    // Set response headers for file download
    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    // Add download limit headers for anonymous users
    if (req.downloadInfo && req.downloadInfo.isAnonymous) {
      res.setHeader('X-Download-Limit', '5')
      res.setHeader(
        'X-Downloads-Used',
        req.downloadInfo.downloadsUsed.toString()
      )
      res.setHeader(
        'X-Downloads-Remaining',
        req.downloadInfo.downloadsRemaining.toString()
      )
    } else {
      res.setHeader('X-Download-Limit', 'unlimited')
      res.setHeader('X-Downloads-Used', '0')
      res.setHeader('X-Downloads-Remaining', 'unlimited')
    }

    // Log download start
    await logService.logDownload(req, info.videoDetails, 'MP4', true)

    // Get format info for progress calculation
    const format = ytdl.chooseFormat(info.formats, {
      quality: quality,
      filter: 'audioandvideo'
    })
    const totalSize = format?.contentLength
      ? parseInt(format.contentLength)
      : null

    if (totalSize) {
      res.setHeader('Content-Length', totalSize.toString())
    }

    // Stream the video directly to response with progress tracking
    const stream = ytdl(url, {
      quality: quality,
      filter: 'audioandvideo'
    })

    let downloadedBytes = 0

    // Track download progress
    stream.on('data', chunk => {
      downloadedBytes += chunk.length
      if (totalSize) {
        const progress = Math.round((downloadedBytes / totalSize) * 100)
        // Note: In a real-world scenario, you might want to emit this progress via WebSocket
        // For now, we'll rely on the client-side simulation
      }
    })

    // Add timeout to prevent hanging downloads
    const timeout = setTimeout(async () => {
      if (!res.headersSent) {
        await logService.warn('Download timeout', req, {
          videoTitle: info.videoDetails.title,
          format: 'MP4'
        })
        res.status(408).json({
          success: false,
          message: 'Download timeout'
        })
      }
      stream.destroy()
    }, 300000) // 5 minutes timeout

    stream.pipe(res)

    // Handle errors
    stream.on('error', error => {
      clearTimeout(timeout)
      console.error('Download MP4 error:', error)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Download failed',
          error:
            process.env.NODE_ENV === 'production'
              ? 'Internal server error'
              : error.message
        })
      }
    })

    // Handle completion
    stream.on('end', () => {
      clearTimeout(timeout)
    })
  } catch (error) {
    console.error('Download MP4 error:', error)
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Download failed',
        error:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message
      })
    }
  }
}

// Download as MP3
export const downloadMP3 = async (req, res) => {
  try {
    const { url, quality = 'highestaudio' } = req.body

    // Additional security check
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid URL is required'
      })
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube URL'
      })
    }

    // Get video info and validate
    const info = await ytdl.getInfo(url)
    const duration = parseInt(info.videoDetails.lengthSeconds)

    if (duration > 7200) {
      // 2 hours max
      return res.status(400).json({
        success: false,
        message: 'Video is too long. Maximum duration is 2 hours.'
      })
    }

    if (info.videoDetails.isPrivate || info.videoDetails.isLiveContent) {
      return res.status(400).json({
        success: false,
        message: 'This video is not available for download'
      })
    }

    const videoTitle = info.videoDetails.title
      .replace(/[^\w\s]/gi, '')
      .substring(0, 50)
    const timestamp = Date.now()
    const fileName = `${videoTitle}_${timestamp}.mp3`

    // Set response headers for file download
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    // Add download limit headers for anonymous users
    if (req.downloadInfo && req.downloadInfo.isAnonymous) {
      res.setHeader('X-Download-Limit', '5')
      res.setHeader(
        'X-Downloads-Used',
        req.downloadInfo.downloadsUsed.toString()
      )
      res.setHeader(
        'X-Downloads-Remaining',
        req.downloadInfo.downloadsRemaining.toString()
      )
    } else {
      res.setHeader('X-Download-Limit', 'unlimited')
      res.setHeader('X-Downloads-Used', '0')
      res.setHeader('X-Downloads-Remaining', 'unlimited')
    }

    // Log download start
    await logService.logDownload(req, info.videoDetails, 'MP3', true)

    // Get format info for progress calculation
    const format = ytdl.chooseFormat(info.formats, {
      quality: quality,
      filter: 'audioonly'
    })
    const totalSize = format?.contentLength
      ? parseInt(format.contentLength)
      : null

    if (totalSize) {
      res.setHeader('Content-Length', totalSize.toString())
    }

    // Stream the audio directly to response with progress tracking
    const stream = ytdl(url, {
      quality: quality,
      filter: 'audioonly'
    })

    let downloadedBytes = 0

    // Track download progress
    stream.on('data', chunk => {
      downloadedBytes += chunk.length
      if (totalSize) {
        const progress = Math.round((downloadedBytes / totalSize) * 100)
        // Note: In a real-world scenario, you might want to emit this progress via WebSocket
        // For now, we'll rely on the client-side simulation
      }
    })

    // Add timeout to prevent hanging downloads
    const timeout = setTimeout(async () => {
      if (!res.headersSent) {
        await logService.warn('Download timeout', req, {
          videoTitle: info.videoDetails.title,
          format: 'MP3'
        })
        res.status(408).json({
          success: false,
          message: 'Download timeout'
        })
      }
      stream.destroy()
    }, 300000) // 5 minutes timeout

    stream.pipe(res)

    // Handle errors
    stream.on('error', error => {
      clearTimeout(timeout)
      console.error('Download MP3 error:', error)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Download failed',
          error:
            process.env.NODE_ENV === 'production'
              ? 'Internal server error'
              : error.message
        })
      }
    })

    // Handle completion
    stream.on('end', () => {
      clearTimeout(timeout)
    })
  } catch (error) {
    console.error('Download MP3 error:', error)
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Download failed',
        error:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message
      })
    }
  }
}
