import express from 'express'
import {
  register,
  login,
  verifyOTP,
  googleAuth
} from '../controllers/authController.js'

const router = express.Router()

// Register route
router.post('/register', register)

// Login route
router.post('/login', login)

// Verify OTP route
router.post('/verify-otp', verifyOTP)

// Google authentication route
router.post('/google', googleAuth)

export default router
