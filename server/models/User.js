import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: function () {
        return !this.isGoogle // Only required if not a Google user
      }
    },
    isGoogle: {
      type: Boolean,
      default: false
    },
    onBoardingComplete: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    otp: {
      code: String,
      expiresAt: Date
    },
    profilePicture: String
  },
  {
    timestamps: true
  }
)

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isGoogle) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (this.isGoogle) return true // Skip password check for Google users
  return bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', userSchema)

export default User
