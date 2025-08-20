#!/usr/bin/env node

/**
 * YouTube Cookie Extractor Helper Script
 * 
 * This script helps you extract YouTube cookies from your browser
 * for use with the YouTube downloader in production.
 * 
 * Usage:
 * 1. Copy the entire cookie string from your browser's developer tools
 * 2. Run: node utils/extract-cookies.js "your-cookie-string-here"
 * 3. Copy the output to your YOUTUBE_COOKIES environment variable
 */

import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const args = process.argv.slice(2)

if (args.length === 0) {
  console.log(`
🍪 YouTube Cookie Extractor

Usage: 
  node extract-cookies.js "your-cookie-string"
  node extract-cookies.js --file cookiesfromyt

Steps to get cookies:
1. Open YouTube.com in your browser and sign in
2. Open Developer Tools (F12)
3. Go to Network tab and refresh the page
4. Click on any request to YouTube
5. Copy the entire "Cookie" header value
6. Run this script with the cookie string

Or export cookies to a JSON file and use --file option

Example:
node extract-cookies.js "VISITOR_INFO1_LIVE=abc123; YSC=def456; GPS=1"
node extract-cookies.js --file cookiesfromyt
`)
  process.exit(1)
}

let cookieString = args[0]

// Handle JSON file input
if (args[0] === '--file' && args[1]) {
  try {
    const filePath = args[1]
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const cookies = JSON.parse(fileContent)
    
    // Convert JSON cookies to string format
    cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
    console.log('📁 Loaded cookies from JSON file')
  } catch (error) {
    console.error('❌ Error reading JSON file:', error.message)
    process.exit(1)
  }
}

try {
  // Parse and clean the cookie string
  const cookies = cookieString
    .split(';')
    .map(cookie => cookie.trim())
    .filter(cookie => cookie.length > 0)
    .filter(cookie => {
      // Keep only important YouTube cookies
      const name = cookie.split('=')[0].toLowerCase()
      return ['visitor_info1_live', 'ysc', 'gps', 'pref', 'sid', 'hsid', 'ssid', 'apisid', 'sapisid', 'login_info'].some(important => 
        name.includes(important)
      )
    })

  if (cookies.length === 0) {
    console.error('❌ No valid YouTube cookies found in the provided string.')
    console.log('Make sure you copied the cookies from YouTube.com while signed in.')
    process.exit(1)
  }

  const cleanCookieString = cookies.join('; ')
  
  console.log('✅ Extracted YouTube cookies:')
  console.log('')
  console.log('Add this to your environment variables:')
  console.log('YOUTUBE_COOKIES=' + cleanCookieString)
  console.log('')
  console.log('Found cookies:')
  cookies.forEach(cookie => {
    const [name] = cookie.split('=')
    console.log(`  - ${name}`)
  })
  console.log('')
  console.log('⚠️  Remember:')
  console.log('   - Keep these cookies private')
  console.log('   - Update them when they expire (every few weeks)')
  console.log('   - Use cookies from an account that can access your target videos')

} catch (error) {
  console.error('❌ Error parsing cookies:', error.message)
  console.log('Make sure the cookie string is properly formatted.')
  process.exit(1)
}
