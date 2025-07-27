import { useState } from 'react'
import { toast } from 'sonner'
import api from '@/api/api'

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

export default function TestPage () {
  const [url, setUrl] = useState('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const getVideoInfo = async () => {
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL')
      return
    }

    setLoading(true)
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
      setLoading(false)
    }
  }

  const downloadMP4 = async () => {
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL')
      return
    }

    setDownloading(true)
    try {
      const response = await api.post(
        'api/download/mp4',
        { url },
        {
          responseType: 'blob'
        }
      )

      // Create download link
      const blob = new Blob([response.data], { type: 'video/mp4' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `video_${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('MP4 download started!')
    } catch (error: any) {
      console.error('Error downloading MP4:', error)
      toast.error('Failed to download MP4')
    } finally {
      setDownloading(false)
    }
  }

  const downloadMP3 = async () => {
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL')
      return
    }

    setDownloading(true)
    try {
      const response = await api.post(
        'api/download/mp3',
        { url },
        {
          responseType: 'blob'
        }
      )

      // Create download link
      const blob = new Blob([response.data], { type: 'audio/mpeg' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `audio_${Date.now()}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('MP3 download started!')
    } catch (error: any) {
      console.error('Error downloading MP3:', error)
      toast.error('Failed to download MP3')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className='min-h-screen bg-[var(--background)] text-[var(--foreground)] py-20'>
      <div className='max-w-4xl mx-auto px-4'>
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold mb-4'>YouTube Download Test</h1>
          <p className='text-[var(--foreground-muted)]'>
            Test the YouTube download functionality
          </p>
        </div>

        {/* URL Input */}
        <div className='bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 mb-6'>
          <div className='flex gap-4 mb-4'>
            <input
              type='url'
              placeholder='Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)'
              value={url}
              onChange={e => setUrl(e.target.value)}
              className='flex-1 px-4 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'
            />
            <button
              onClick={getVideoInfo}
              disabled={loading}
              className='px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Loading...' : 'Get Info'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-4'>
            <button
              onClick={downloadMP4}
              disabled={downloading || !url.trim()}
              className='px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {downloading ? 'Downloading...' : 'Download MP4'}
            </button>
            <button
              onClick={downloadMP3}
              disabled={downloading || !url.trim()}
              className='px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {downloading ? 'Downloading...' : 'Download MP3'}
            </button>
          </div>
        </div>

        {/* Video Info Display */}
        {videoInfo && (
          <div className='bg-[var(--card)] border border-[var(--border)] rounded-lg p-6'>
            <h2 className='text-2xl font-bold mb-4'>Video Information</h2>

            <div className='grid md:grid-cols-2 gap-6'>
              {/* Video Details */}
              <div>
                <h3 className='text-lg font-semibold mb-3'>Details</h3>
                <div className='space-y-2'>
                  <p>
                    <strong>Title:</strong> {videoInfo.title}
                  </p>
                  <p>
                    <strong>Author:</strong> {videoInfo.author}
                  </p>
                  <p>
                    <strong>Duration:</strong>{' '}
                    {Math.floor(parseInt(videoInfo.duration) / 60)}:
                    {(parseInt(videoInfo.duration) % 60)
                      .toString()
                      .padStart(2, '0')}
                  </p>
                  <p>
                    <strong>Views:</strong>{' '}
                    {parseInt(videoInfo.viewCount).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <h3 className='text-lg font-semibold mb-3'>Thumbnail</h3>
                {videoInfo.thumbnail && (
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className='w-full max-w-sm rounded-lg'
                  />
                )}
              </div>
            </div>

            {/* Available Formats */}
            <div className='mt-6'>
              <h3 className='text-lg font-semibold mb-3'>Available Formats</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
                {videoInfo.formats.slice(0, 9).map((format, index) => (
                  <div
                    key={index}
                    className='p-3 border border-[var(--border)] rounded-md text-sm'
                  >
                    <p>
                      <strong>Quality:</strong> {format.quality || 'Unknown'}
                    </p>
                    <p>
                      <strong>Container:</strong> {format.container}
                    </p>
                    <p>
                      <strong>Audio:</strong> {format.hasAudio ? 'Yes' : 'No'}
                    </p>
                    <p>
                      <strong>Video:</strong> {format.hasVideo ? 'Yes' : 'No'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className='mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
          <h3 className='text-lg font-semibold mb-2'>How to Test:</h3>
          <ol className='list-decimal list-inside space-y-1 text-sm'>
            <li>Paste a YouTube URL in the input field</li>
            <li>Click "Get Info" to see video details</li>
            <li>Click "Download MP4" to download as video</li>
            <li>Click "Download MP3" to download as audio</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
