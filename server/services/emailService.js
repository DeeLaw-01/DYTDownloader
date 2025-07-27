import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Verify the transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('Transporter verification failed:', error)
  } else {
    console.log('Server is ready to take our messages')
  }
})

export const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"Dytdownloader" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Email Verification</h1>
        <p>Your OTP for email verification is:</p>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
          <strong>${otp}</strong>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
