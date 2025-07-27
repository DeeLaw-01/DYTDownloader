import mongoose from 'mongoose'

const logSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug'],
      default: 'info'
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      required: false
    },
    url: {
      type: String,
      required: false
    },
    statusCode: {
      type: Number,
      required: false
    },
    responseTime: {
      type: Number, // in milliseconds
      required: false
    },
    ip: {
      type: String,
      required: false
    },
    userAgent: {
      type: String,
      required: false
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    action: {
      type: String,
      required: false
    },
    error: {
      name: String,
      message: String,
      stack: String
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
)

// Index for efficient querying
logSchema.index({ timestamp: -1 })
logSchema.index({ level: 1, timestamp: -1 })
logSchema.index({ method: 1, timestamp: -1 })
logSchema.index({ statusCode: 1, timestamp: -1 })
logSchema.index({ userId: 1, timestamp: -1 })

// TTL index to automatically delete old logs (keep for 30 days)
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

const Log = mongoose.model('Log', logSchema)

export default Log
