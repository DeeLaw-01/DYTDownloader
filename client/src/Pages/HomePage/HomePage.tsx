'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Music, Video, Clock, Eye, User, Loader2, Search } from 'lucide-react'
import api from '@/api/api'
import useUserStore from '@/store/userStore'

interface VideoInfo {
  title: string
  duration: string
  thumbnail: string
  author: string
  viewCount: string
  formats: Array<{
    itag: number
    quality: string
    container: string
    hasAudio: boolean
    hasVideo: boolean
  }>
}

export default function HomePage () {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [url, setUrl] = useState('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [downloadingMP3, setDownloadingMP3] = useState(false)
  const [downloadingMP4, setDownloadingMP4] = useState<number | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<{
    type: 'mp3' | 'mp4' | null
    progress: number
    phase: 'fetching' | 'processing' | 'downloading'
    estimatedTime?: number
  }>({
    type: null,
    progress: 0,
    phase: 'fetching'
  })
  const [downloadLimit, setDownloadLimit] = useState<{
    limit: string
    used: string
    remaining: string
  } | null>(null)

  // Reset download limit when user logs out
  useEffect(() => {
    if (!user) {
      setDownloadLimit(null)
    }
  }, [user])

  // Utility function to estimate remaining time
  const getEstimatedTime = (
    progress: number,
    startTime: number
  ): number | undefined => {
    if (progress <= 5) return undefined // Don't show ETA until we have some progress
    const elapsed = Date.now() - startTime
    const rate = progress / elapsed
    const remaining = (100 - progress) / rate
    const seconds = Math.round(remaining / 1000)
    return seconds > 0 ? seconds : undefined
  }

  // Check if user has downloads remaining
  const hasDownloadsRemaining = () => {
    if (user) return true // Logged in users have unlimited downloads
    if (!downloadLimit) return true // First time user, has 5 downloads
    return parseInt(downloadLimit.remaining) > 0
  }

  // Handle download when limit is reached
  const handleDownloadLimitReached = () => {
    toast.error('Download limit reached!', {
      description: 'Please login for unlimited downloads.',
      action: {
        label: 'Login',
        onClick: () => navigate('/login')
      }
    })
  }

  const getVideoInfo = async () => {
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL')
      return
    }
    setLoadingInfo(true)
    try {
      const response = await api.post('api/download/info', { url })
      if (response.data.success) {
        setVideoInfo(response.data.data)
        toast.success('Video info retrieved successfully!')
      } else {
        toast.error(response.data.message || 'Failed to get video info')
      }
    } catch (error: any) {
      console.error('Error getting video info:', error)
      toast.error(error.response?.data?.message || 'Failed to get video info')
    } finally {
      setLoadingInfo(false)
    }
  }

  const downloadMP3 = async () => {
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL')
      return
    }

    // Check download limit for anonymous users
    if (!hasDownloadsRemaining()) {
      handleDownloadLimitReached()
      return
    }

    setDownloadingMP3(true)
    const startTime = Date.now()
    setDownloadProgress({
      type: 'mp3',
      progress: 0,
      phase: 'fetching',
      estimatedTime: undefined
    })

    try {
      let requestStarted = false
      let progressInterval: NodeJS.Timeout | null = null

      // Realistic fetching phase simulation
      const fetchingSimulation = () => {
        progressInterval = setInterval(() => {
          setDownloadProgress(prev => {
            if (!requestStarted && prev.progress < 10) {
              // Slow fetching progress
              const increment = Math.random() * 2 + 0.5 // 0.5-2.5% increments
              const newProgress = Math.min(prev.progress + increment, 10)
              const estimatedTime =
                newProgress > 2
                  ? getEstimatedTime(newProgress * 10, startTime)
                  : undefined

              return {
                ...prev,
                progress: newProgress,
                phase: 'fetching',
                estimatedTime
              }
            }
            return prev
          })
        }, 600)
      }

      fetchingSimulation()

      // Simulate server processing time
      setTimeout(() => {
        requestStarted = true
        setDownloadProgress(prev => ({
          ...prev,
          progress: 12,
          phase: 'processing'
        }))
      }, 1500)

      const response = await api.post(
        'api/download/mp3',
        { url },
        {
          responseType: 'blob',
          onDownloadProgress: progressEvent => {
            if (progressInterval) clearInterval(progressInterval)

            if (progressEvent.total) {
              // Real download progress: map from 20% to 100%
              const actualProgress = progressEvent.loaded / progressEvent.total
              const totalProgress = 20 + actualProgress * 80 // 20-100%
              const percentCompleted = Math.round(totalProgress)
              const estimatedTime = getEstimatedTime(
                percentCompleted,
                startTime
              )

              setDownloadProgress(prev => ({
                ...prev,
                progress: percentCompleted,
                phase: actualProgress > 0.1 ? 'downloading' : 'processing',
                estimatedTime
              }))
            } else {
              // Fallback progressive simulation when no content-length
              setDownloadProgress(prev => {
                if (prev.progress < 95) {
                  const baseProgress = Math.max(prev.progress, 20)
                  const increment = Math.random() * 8 + 3 // 3-11% increments
                  const newProgress = Math.min(baseProgress + increment, 95)
                  const estimatedTime = getEstimatedTime(newProgress, startTime)

                  return {
                    ...prev,
                    progress: newProgress,
                    phase: newProgress > 30 ? 'downloading' : 'processing',
                    estimatedTime
                  }
                }
                return prev
              })
            }
          }
        }
      )

      if (progressInterval) clearInterval(progressInterval)
      setDownloadProgress({
        type: 'mp3',
        progress: 100,
        phase: 'downloading',
        estimatedTime: undefined
      })

      // Update download limit info from headers
      const limit = response.headers['x-download-limit']
      const used = response.headers['x-downloads-used']
      const remaining = response.headers['x-downloads-remaining']

      if (limit && used && remaining) {
        setDownloadLimit({ limit, used, remaining })
      }

      const blob = new Blob([response.data], { type: 'audio/mpeg' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${videoInfo?.title || 'audio'}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
      toast.success('MP3 download completed!')
    } catch (error: any) {
      console.error('Error downloading MP3:', error)
      if (error.response?.status === 429) {
        toast.error(error.response.data.message || 'Download limit exceeded')
      } else {
        toast.error('Failed to download MP3')
      }
    } finally {
      setDownloadingMP3(false)
      setDownloadProgress({
        type: null,
        progress: 0,
        phase: 'fetching',
        estimatedTime: undefined
      })
    }
  }

  const downloadMP4 = async (quality?: string) => {
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL')
      return
    }

    // Check download limit for anonymous users
    if (!hasDownloadsRemaining()) {
      handleDownloadLimitReached()
      return
    }

    setDownloadingMP4(quality ? Number.parseInt(quality) : 0)
    const startTime = Date.now()
    setDownloadProgress({
      type: 'mp4',
      progress: 0,
      phase: 'fetching',
      estimatedTime: undefined
    })

    try {
      let requestStarted = false
      let progressInterval: NodeJS.Timeout | null = null

      // Realistic fetching phase simulation (video processing takes longer)
      const fetchingSimulation = () => {
        progressInterval = setInterval(() => {
          setDownloadProgress(prev => {
            if (!requestStarted && prev.progress < 8) {
              // Slower fetching for video (more processing needed)
              const increment = Math.random() * 1.5 + 0.3 // 0.3-1.8% increments
              const newProgress = Math.min(prev.progress + increment, 8)
              const estimatedTime =
                newProgress > 1
                  ? getEstimatedTime(newProgress * 12, startTime)
                  : undefined

              return {
                ...prev,
                progress: newProgress,
                phase: 'fetching',
                estimatedTime
              }
            }
            return prev
          })
        }, 800) // Slower for video processing
      }

      fetchingSimulation()

      // Simulate longer server processing time for video
      setTimeout(() => {
        requestStarted = true
        setDownloadProgress(prev => ({
          ...prev,
          progress: 10,
          phase: 'processing'
        }))
      }, 2500) // Longer delay for video processing

      const response = await api.post(
        'api/download/mp4',
        { url, quality },
        {
          responseType: 'blob',
          onDownloadProgress: progressEvent => {
            if (progressInterval) clearInterval(progressInterval)

            if (progressEvent.total) {
              // Real download progress: map from 15% to 100% (video needs more processing)
              const actualProgress = progressEvent.loaded / progressEvent.total
              const totalProgress = 15 + actualProgress * 85 // 15-100%
              const percentCompleted = Math.round(totalProgress)
              const estimatedTime = getEstimatedTime(
                percentCompleted,
                startTime
              )

              setDownloadProgress(prev => ({
                ...prev,
                progress: percentCompleted,
                phase: actualProgress > 0.05 ? 'downloading' : 'processing',
                estimatedTime
              }))
            } else {
              // Fallback progressive simulation for video
              setDownloadProgress(prev => {
                if (prev.progress < 95) {
                  const baseProgress = Math.max(prev.progress, 15)
                  const increment = Math.random() * 6 + 2 // 2-8% increments (smaller for video)
                  const newProgress = Math.min(baseProgress + increment, 95)
                  const estimatedTime = getEstimatedTime(newProgress, startTime)

                  return {
                    ...prev,
                    progress: newProgress,
                    phase: newProgress > 25 ? 'downloading' : 'processing',
                    estimatedTime
                  }
                }
                return prev
              })
            }
          }
        }
      )

      if (progressInterval) clearInterval(progressInterval)
      setDownloadProgress({
        type: 'mp4',
        progress: 100,
        phase: 'downloading',
        estimatedTime: undefined
      })

      // Update download limit info from headers
      const limit = response.headers['x-download-limit']
      const used = response.headers['x-downloads-used']
      const remaining = response.headers['x-downloads-remaining']

      if (limit && used && remaining) {
        setDownloadLimit({ limit, used, remaining })
      }

      const blob = new Blob([response.data], { type: 'video/mp4' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${videoInfo?.title || 'video'}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
      toast.success('MP4 download completed!')
    } catch (error: any) {
      console.error('Error downloading MP4:', error)
      if (error.response?.status === 429) {
        toast.error(error.response.data.message || 'Download limit exceeded')
      } else {
        toast.error('Failed to download MP4')
      }
    } finally {
      setDownloadingMP4(null)
      setDownloadProgress({
        type: null,
        progress: 0,
        phase: 'fetching',
        estimatedTime: undefined
      })
    }
  }

  const formatDuration = (seconds: string) => {
    const mins = Math.floor(Number.parseInt(seconds) / 60)
    const secs = Number.parseInt(seconds) % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatViews = (views: string) => {
    const num = Number.parseInt(views)
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  // Get unique video qualities for MP4 download
  const videoQualities =
    videoInfo?.formats
      .filter(format => format.hasVideo && format.hasAudio)
      .reduce((acc, format) => {
        if (!acc.find(q => q.quality === format.quality)) {
          acc.push(format)
        }
        return acc
      }, [] as typeof videoInfo.formats)
      .sort((a, b) => {
        const aRes = Number.parseInt(a.quality?.replace('p', '') || '0')
        const bRes = Number.parseInt(b.quality?.replace('p', '') || '0')
        return bRes - aRes
      }) || []

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
      {/* Subtle background pattern */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-0 left-0 w-72 h-72 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl animate-pulse'></div>
        <div className='absolute top-0 right-0 w-72 h-72 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000'></div>
        <div className='absolute bottom-0 left-0 w-72 h-72 bg-pink-200 dark:bg-pink-900 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500'></div>
      </div>

      <div className='relative z-10'>
        <main className='max-w-5xl mx-auto px-4 sm:px-6'>
          {/* Hero Section */}
          <section className='py-12 sm:py-16 lg:py-20 text-center'>
            <div className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-6'>
              ✨ Free YouTube Downloader
            </div>
            <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight text-gray-900 dark:text-white mb-4 tracking-tight leading-tight'>
              Download YouTube content
              <span className='block text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-blue-600 dark:text-blue-400 font-light mt-2'>
                effortlessly
              </span>
            </h1>
            <p className='text-base sm:text-lg text-gray-600 dark:text-gray-400 font-light max-w-2xl mx-auto leading-relaxed px-4'>
              Simple, fast, and reliable YouTube video and audio downloads with
              no hassle
            </p>
          </section>

          {/* Download Limit Info - Minimal Side Display */}
          {!user && (
            <div className=' hidden md:block absolute top-2 md:top-4 md:left-4 z-20'>
              <div className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm'>
                <div className='flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400'>
                  {hasDownloadsRemaining() ? (
                    <>
                      <span>Downloads:</span>
                      <span className='font-medium text-blue-600 dark:text-blue-400'>
                        {downloadLimit ? downloadLimit.remaining : '5'}{' '}
                        remaining
                      </span>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate('/login')}
                      className='text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs underline'
                    >
                      Login for unlimited
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* URL Input */}
          <section className='mb-12 sm:mb-16'>
            <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300'>
              <div className='p-4 sm:p-6 lg:p-8'>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
                  <div className='flex-1 relative group'>
                    <input
                      type='url'
                      placeholder='Paste your YouTube URL here...'
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && getVideoInfo()}
                      className='w-full px-4 py-3 sm:py-4 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                    />
                    <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 '>
                      <Search className='w-4 h-4' />
                    </div>
                  </div>
                  <button
                    onClick={getVideoInfo}
                    disabled={loadingInfo || !url.trim()}
                    className='px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.01] disabled:transform-none cursor-pointer'
                  >
                    {loadingInfo ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <Search className='w-4 h-4' />
                    )}
                    <span className='hidden sm:inline'>
                      {loadingInfo ? 'Searching...' : 'Search'}
                    </span>
                    <span className='sm:hidden'>
                      {loadingInfo ? '...' : 'Search'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Video Info */}
          {videoInfo && (
            <section className='mb-12 sm:mb-16'>
              <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden'>
                <div className='p-4 sm:p-6 lg:p-8'>
                  <div className='flex flex-col lg:grid lg:grid-cols-5 gap-6 lg:gap-8'>
                    {/* Thumbnail */}
                    <div className='lg:col-span-2'>
                      <div className='aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg sm:rounded-xl overflow-hidden shadow-md'>
                        <img
                          src={
                            videoInfo.thumbnail ||
                            '/placeholder.svg?height=360&width=640&query=video thumbnail'
                          }
                          alt={videoInfo.title}
                          className='w-full h-full object-cover hover:scale-[1.01] transition-transform duration-300'
                        />
                      </div>
                    </div>

                    {/* Details & Downloads */}
                    <div className='lg:col-span-3 space-y-6 sm:space-y-6'>
                      <div>
                        <h3 className='text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 leading-snug'>
                          {videoInfo.title}
                        </h3>

                        <div className='flex flex-wrap gap-3 sm:gap-4 text-sm text-gray-600 dark:text-gray-400'>
                          <div className='flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md'>
                            <User className='w-3 h-3' />
                            <span className='truncate max-w-32 sm:max-w-none'>
                              {videoInfo.author}
                            </span>
                          </div>
                          <div className='flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md'>
                            <Clock className='w-3 h-3' />
                            <span>{formatDuration(videoInfo.duration)}</span>
                          </div>
                          <div className='flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md'>
                            <Eye className='w-3 h-3' />
                            <span>
                              {formatViews(videoInfo.viewCount)} views
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Download Options */}
                      <div className='space-y-5 sm:space-y-6'>
                        {/* Audio Download */}
                        <div>
                          <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2'>
                            <Music className='w-4 h-4 text-green-600 dark:text-green-400' />
                            Audio Download
                          </label>
                          <button
                            onClick={downloadMP3}
                            disabled={downloadingMP3}
                            className='w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg sm:rounded-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-[1.01] disabled:transform-none cursor-pointer'
                          >
                            {downloadingMP3 ? (
                              <Loader2 className='w-4 h-4 animate-spin' />
                            ) : (
                              <Music className='w-4 h-4' />
                            )}
                            {downloadingMP3 ? 'Downloading...' : 'Download MP3'}
                          </button>
                        </div>

                        {/* Video Download */}
                        <div>
                          <label className='block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2'>
                            <Video className='w-4 h-4 text-red-600 dark:text-red-400' />
                            Video Download
                          </label>
                          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3'>
                            {videoQualities.length > 0 ? (
                              videoQualities.map(format => (
                                <button
                                  key={format.itag}
                                  onClick={() => downloadMP4(format.quality)}
                                  disabled={downloadingMP4 === format.itag}
                                  className='px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-[1.01] disabled:transform-none cursor-pointer'
                                >
                                  {downloadingMP4 === format.itag ? (
                                    <Loader2 className='w-3 h-3 animate-spin' />
                                  ) : (
                                    <Video className='w-3 h-3' />
                                  )}
                                  <span className='truncate'>
                                    {downloadingMP4 === format.itag
                                      ? '...'
                                      : format.quality || 'Default'}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <button
                                onClick={() => downloadMP4()}
                                disabled={downloadingMP4 === 0}
                                className='px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-[1.01] disabled:transform-none cursor-pointer'
                              >
                                {downloadingMP4 === 0 ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <Video className='w-4 h-4' />
                                )}
                                {downloadingMP4 === 0 ? '...' : 'MP4'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Progress Bar */}
          {downloadProgress.type && (
            <section className='mb-8'>
              <div className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      {downloadProgress.type === 'mp3' ? (
                        <Music className='w-5 h-5 text-green-600' />
                      ) : (
                        <Video className='w-5 h-5 text-red-600' />
                      )}
                      <div>
                        <h3 className='font-semibold text-gray-900 dark:text-white'>
                          Downloading {downloadProgress.type.toUpperCase()}
                        </h3>
                        <p className='text-sm text-gray-600 dark:text-gray-400 capitalize'>
                          {downloadProgress.phase === 'fetching' &&
                            'Fetching video information...'}
                          {downloadProgress.phase === 'processing' &&
                            'Processing video...'}
                          {downloadProgress.phase === 'downloading' &&
                            'Downloading file...'}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                        {Math.round(downloadProgress.progress)}%
                      </div>
                      <div className='text-xs text-gray-500 dark:text-gray-400'>
                        {downloadProgress.progress < 30 && 'Getting ready...'}
                        {downloadProgress.progress >= 30 &&
                          downloadProgress.progress < 70 &&
                          'Processing...'}
                        {downloadProgress.progress >= 70 &&
                          downloadProgress.progress < 100 &&
                          'Almost done...'}
                        {downloadProgress.progress >= 100 && 'Complete!'}
                        {downloadProgress.estimatedTime &&
                          downloadProgress.progress < 100 && (
                            <div className='mt-1'>
                              ETA: {downloadProgress.estimatedTime}s
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden'>
                    <div
                      className={`h-full transition-all duration-500 ease-out rounded-full ${
                        downloadProgress.type === 'mp3'
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ width: `${downloadProgress.progress}%` }}
                    >
                      <div className='h-full w-full bg-white/30 animate-pulse rounded-full'></div>
                    </div>
                  </div>

                  {/* Progress Steps */}
                  <div className='flex justify-between text-xs text-gray-500 dark:text-gray-400'>
                    <span
                      className={
                        downloadProgress.phase === 'fetching'
                          ? 'text-blue-600 dark:text-blue-400 font-medium'
                          : ''
                      }
                    >
                      Fetching
                    </span>
                    <span
                      className={
                        downloadProgress.phase === 'processing'
                          ? 'text-blue-600 dark:text-blue-400 font-medium'
                          : ''
                      }
                    >
                      Processing
                    </span>
                    <span
                      className={
                        downloadProgress.phase === 'downloading'
                          ? 'text-blue-600 dark:text-blue-400 font-medium'
                          : ''
                      }
                    >
                      Downloading
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Instructions */}
          <section className='pb-12 sm:pb-16 lg:pb-20'>
            <div className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl sm:rounded-2xl p-4 sm:p-6'>
              <h3 className='text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2'>
                <div className='w-2 h-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'></div>
                Instructions
              </h3>
              <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm text-gray-600 dark:text-gray-400'>
                <div className='flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg'>
                  <div className='w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>
                    1
                  </div>
                  <span>Paste YouTube URL</span>
                </div>
                <div className='flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg'>
                  <div className='w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>
                    2
                  </div>
                  <span>Click Search</span>
                </div>
                <div className='flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg'>
                  <div className='w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>
                    3
                  </div>
                  <span>Choose format</span>
                </div>
                <div className='flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg'>
                  <div className='w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>
                    4
                  </div>
                  <span>Download starts</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
