# YouTube Download API

This server provides YouTube video download functionality with the following endpoints:

## Base URL

```
http://localhost:4000/api/download
```

## Endpoints

### 1. Get Video Information

**POST** `/info`

Get detailed information about a YouTube video before downloading.

**Request Body:**

```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "title": "Video Title",
    "duration": "180",
    "thumbnail": "https://...",
    "author": "Channel Name",
    "viewCount": "1000000",
    "formats": [...]
  }
}
```

### 2. Download as MP4

**POST** `/mp4`

Download YouTube video as MP4 file.

**Request Body:**

```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "quality": "highest" // optional, defaults to "highest"
}
```

**Response:** Direct file download (video/mp4)

### 3. Download as MP3

**POST** `/mp3`

Download YouTube video as MP3 audio file.

**Request Body:**

```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "quality": "highestaudio" // optional, defaults to "highestaudio"
}
```

**Response:** Direct file download (audio/mpeg)

## Quality Options

### For MP4:

- `highest` - Best quality available
- `lowest` - Lowest quality available
- `highestvideo` - Best video quality (may not include audio)
- `lowestvideo` - Lowest video quality

### For MP3:

- `highestaudio` - Best audio quality available
- `lowestaudio` - Lowest audio quality available

## Error Responses

All endpoints return error responses in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Example Usage

### Using curl:

```bash
# Get video info
curl -X POST http://localhost:4000/api/download/info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Download MP4
curl -X POST http://localhost:4000/api/download/mp4 \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  --output video.mp4

# Download MP3
curl -X POST http://localhost:4000/api/download/mp3 \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  --output audio.mp3
```

### Using JavaScript/Fetch:

```javascript
// Get video info
const getVideoInfo = async url => {
  const response = await fetch('http://localhost:4000/api/download/info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url })
  })
  return response.json()
}

// Download MP4
const downloadMP4 = async url => {
  const response = await fetch('http://localhost:4000/api/download/mp4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url })
  })

  if (response.ok) {
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = 'video.mp4'
    a.click()
  }
}
```

## Notes

- Files are streamed directly to the client (no server storage)
- Video titles are sanitized for safe filenames
- All downloads include timestamps to prevent filename conflicts
- The API validates YouTube URLs before processing
