import User from '../models/User.js'
import { sendOTP, generateOTP } from '../services/emailService.js'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import logService from '../services/logService.js'

dotenv.config()

// Register new user
export const register = async (req, res) => {
  try {
    const { name, email, password, isGoogle } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Create new user
    const user = new User({
      name,
      email,
      password: isGoogle ? undefined : password,
      isGoogle: isGoogle || false,
      otp: {
        code: otp,
        expiresAt: otpExpiry
      }
    })

    await user.save()

    // Send OTP email
    if (!isGoogle) {
      const emailSent = await sendOTP(email, otp)
      if (!emailSent) {
        return res.status(500).json({ message: 'Failed to send OTP' })
      }
    }

    // Log registration
    await logService.createLog({
      level: 'info',
      message: 'User registration',
      method: req.method,
      url: req.originalUrl,
      ip: logService.getClientIP(req),
      userAgent: req.headers['user-agent'],
      action: 'registration',
      metadata: {
        userEmail: email,
        userName: name,
        isGoogle: isGoogle || false
      }
    })

    res.status(201).json({
      message: isGoogle
        ? 'User registered successfully'
        : 'OTP sent to your email',
      userId: user._id
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Registration failed' })
  }
}

// Login user
export const login = async (req, res) => {
  try {
    const { email, password, isGoogle } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if user is verified
    if (!user.isVerified && !isGoogle) {
      // Generate new OTP
      const otp = generateOTP()
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Update user's OTP
      user.otp = {
        code: otp,
        expiresAt: otpExpiry
      }
      await user.save()

      // Send new OTP
      const emailSent = await sendOTP(email, otp)
      if (!emailSent) {
        return res.status(500).json({ message: 'Failed to send OTP' })
      }

      return res.status(200).json({
        message: 'Please verify your email',
        needsVerification: true
      })
    }

    // For non-Google users, verify password
    if (!isGoogle) {
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' })
      }
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    })

    // Log successful login
    await logService.createLog({
      level: 'info',
      message: 'User login',
      method: req.method,
      url: req.originalUrl,
      ip: logService.getClientIP(req),
      userAgent: req.headers['user-agent'],
      userId: user._id,
      action: 'login',
      metadata: {
        userEmail: user.email,
        userName: user.name,
        isGoogle: user.isGoogle
      }
    })

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isGoogle: user.isGoogle,
        isAdmin: user.isAdmin,
        onBoardingComplete: user.onBoardingComplete,
        profilePicture: user.profilePicture
      }
    })
  } catch (error) {
    console.log('Login error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
}

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({ message: 'No OTP found' })
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' })
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ message: 'OTP expired' })
    }

    // Update user
    user.isVerified = true
    user.otp = undefined
    await user.save()

    res.json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('OTP verification error:', error)
    res.status(500).json({ message: 'OTP verification failed' })
  }
}

// Google authentication
export const googleAuth = async (req, res) => {
  try {
    const { name, email, profilePicture } = req.body

    let user = await User.findOne({ email })

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        name,
        email,
        isGoogle: true,
        isVerified: true,
        profilePicture
      })
      await user.save()
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    })

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isGoogle: user.isGoogle,
        onBoardingComplete: user.onBoardingComplete,
        profilePicture: user.profilePicture
      }
    })
  } catch (error) {
    console.error('Google auth error:', error)
    res.status(500).json({ message: 'Google authentication failed' })
  }
}
