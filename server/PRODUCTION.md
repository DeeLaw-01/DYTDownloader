# Production Deployment Guide

## 🚀 Security Measures Implemented

### 1. **Rate Limiting**

- **General API**: 100 requests per 15 minutes per IP
- **Download endpoints**: 10 requests per 15 minutes per IP
- **Speed limiting**: Progressive delays after 5 requests

### 2. **Input Validation**

- YouTube URL validation with regex
- Request size limiting (1MB max)
- Quality parameter validation
- Type checking for all inputs

### 3. **Security Headers**

- Helmet.js for security headers
- Content Security Policy (CSP)
- HSTS (HTTP Strict Transport Security)
- XSS protection
- Frame guard (clickjacking protection)

### 4. **CORS Protection**

- Whitelist-based origin validation
- Credentials support
- Method restrictions
- Header restrictions

### 5. **Error Handling**

- Centralized error handling
- Production-safe error messages
- Request logging
- Timeout protection (5 minutes)

### 6. **Download Security**

- Video duration limits (2 hours max)
- Private/live content blocking
- Download timeouts
- Cache control headers

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Required
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key

# Optional
PORT=4000
JWT_EXPIRES_IN=7d
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_email_password
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
LOG_LEVEL=info

# YouTube Authentication (Required for production)
YOUTUBE_COOKIES=your_youtube_cookies_here
YTDL_USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

## 🍪 YouTube Cookies Setup (IMPORTANT)

For production environments, YouTube requires authentication cookies to access certain videos. Here's how to get them:

### Method 1: Browser Developer Tools

1. **Open YouTube in your browser** and sign in to your account
2. **Open Developer Tools** (F12 or right-click → Inspect)
3. **Go to the Network tab** and refresh the page
4. **Find any request to YouTube** and click on it
5. **Copy the Cookie header** from the Request Headers section
6. **Set the YOUTUBE_COOKIES environment variable** with this value

### Method 2: Browser Extension

1. **Install a cookie exporter extension** (like EditThisCookie for Chrome)
2. **Go to YouTube.com** and sign in
3. **Export cookies** for the youtube.com domain
4. **Format the cookies** as: `name1=value1; name2=value2; name3=value3`
5. **Set the YOUTUBE_COOKIES environment variable**

### Important Notes:

- **Cookies expire**: You'll need to update them periodically (usually every few weeks)
- **Account restrictions**: Use cookies from an account that can access the videos you want to download
- **Security**: Keep your cookies private and don't share them
- **Regional restrictions**: Cookies from different regions may have different access levels

### Cookie Format Example:
```
YOUTUBE_COOKIES=VISITOR_INFO1_LIVE=abcd1234; YSC=xyz789; GPS=1; PREF=f1=50000000
```

## 🚀 Production Deployment

### **Digital Ocean (Recommended)**
Digital Ocean is actually **better** for YouTube downloaders than Vercel because:
- **Static IP addresses** (less likely to be blocked)
- **Direct server access** (no proxy layers)
- **Better for high-bandwidth downloads**
- **More control over server configuration**

#### **Digital Ocean Deployment Steps:**

1. **Create a Droplet**
   ```bash
   # SSH into your Digital Ocean droplet
   ssh root@your-server-ip
   ```

2. **Install Node.js and PM2**
   ```bash
   # Update system
   apt update && apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs
   
   # Install PM2 for process management
   npm install -g pm2
   ```

3. **Deploy Your Application**
   ```bash
   # Clone your repository
   git clone your-repo-url
   cd your-project/server
   
   # Install dependencies
   npm install
   
   # Create .env file
   nano .env
   # Add all environment variables
   
   # Start with PM2
   pm2 start index.js --name "youtube-downloader"
   pm2 startup
   pm2 save
   ```

4. **Set Environment Variables**
   ```bash
   # Add to your .env file on the server
   NODE_ENV=production
   DEPLOYMENT_PLATFORM=digitalocean
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   YOUTUBE_COOKIES=your_youtube_cookies_here
   ```

5. **Configure Nginx (Optional)**
   ```bash
   # Install Nginx
   apt install nginx
   
   # Configure reverse proxy
   nano /etc/nginx/sites-available/youtube-downloader
   ```

### **Vercel Deployment**

#### 1. **Install Vercel CLI**

```bash
npm i -g vercel
```

#### 2. **Deploy**

```bash
vercel --prod
```

#### 3. **Environment Variables in Vercel**

Set all environment variables in your Vercel dashboard:

- Go to your project settings
- Navigate to "Environment Variables"
- Add all variables from the `.env` file above

#### 4. **Vercel Configuration**

The `vercel.json` file is already configured for:

- Node.js runtime
- Proper routing
- Environment variable handling

## 📊 Monitoring & Logging

### Request Logging

All requests are logged with:

- HTTP method
- URL path
- Status code
- Response time

### Error Logging

Errors are logged with:

- Error type
- Stack trace (development only)
- Request context

## 🔒 Security Checklist

- [x] Rate limiting implemented
- [x] Input validation active
- [x] Security headers configured
- [x] CORS properly configured
- [x] Error handling centralized
- [x] Environment variables validated
- [x] Download limits enforced
- [x] Timeout protection active
- [x] Production error messages
- [x] Request logging enabled

## 🚨 Rate Limits Summary

| Endpoint      | Limit        | Window     | Notes                   |
| ------------- | ------------ | ---------- | ----------------------- |
| General API   | 100 requests | 15 minutes | All routes              |
| Download Info | 10 requests  | 15 minutes | Per IP                  |
| Download MP4  | 10 requests  | 15 minutes | Per IP + speed limiting |
| Download MP3  | 10 requests  | 15 minutes | Per IP + speed limiting |

## 🔧 Customization

### Adjusting Rate Limits

Edit `config/environment.js`:

```javascript
RATE_LIMIT_MAX_REQUESTS: 100,        // General API
DOWNLOAD_RATE_LIMIT_MAX: 10,         // Download endpoints
RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000 // 15 minutes
```

### Adjusting Download Limits

Edit `config/environment.js`:

```javascript
MAX_VIDEO_DURATION: 7200,    // 2 hours in seconds
DOWNLOAD_TIMEOUT: 300000,    // 5 minutes in milliseconds
```

### Adding CORS Origins

Add to your `.env` file:

```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

## 🆘 Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**

   - Wait 15 minutes or use a different IP
   - Check if you're making too many requests

2. **CORS Errors**

   - Verify your domain is in `CORS_ORIGINS`
   - Check if you're using HTTPS in production

3. **Download Timeouts**

   - Videos longer than 2 hours are blocked
   - Check your internet connection
   - Try a shorter video

4. **Environment Variables**
   - Ensure all required variables are set in Vercel
   - Check the validation error messages

5. **"This video requires authentication" Error**
   
   - Add YOUTUBE_COOKIES to your environment variables
   - Ensure cookies are up-to-date and valid
   - Try with a different YouTube account
   - Check if the video requires special permissions

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages and logs.

## 📈 Performance Tips

1. **Use appropriate quality settings**

   - `highest` for best quality (larger files)
   - `lowest` for faster downloads

2. **Monitor rate limits**

   - Stay within the 10 downloads per 15 minutes limit
   - Use the speed limiting as a guide

3. **Optimize for your use case**
   - MP3 for audio-only content
   - MP4 for video content

## 🔄 Updates & Maintenance

### Regular Tasks

- Monitor rate limit usage
- Check error logs
- Update dependencies
- Review security headers

### Security Updates

- Keep `@distube/ytdl-core` updated
- Monitor for security advisories
- Update rate limits as needed
