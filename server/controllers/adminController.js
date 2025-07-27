import User from '../models/User.js'
import Log from '../models/Log.js'
import logService from '../services/logService.js'

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      googleUsers,
      adminUsers,
      recentUsers,
      totalDownloads,
      recentDownloads,
      popularFormats
    ] = await Promise.all([
      // User stats
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isGoogle: true }),
      User.countDocuments({ isAdmin: true }),
      User.find().sort({ createdAt: -1 }).limit(10).select('name email createdAt isVerified isGoogle'),
      
      // Download stats
      Log.countDocuments({ action: 'download' }),
      Log.find({ action: 'download' }).sort({ timestamp: -1 }).limit(10).populate('userId', 'name email'),
      Log.aggregate([
        { $match: { action: 'download' } },
        { $group: { _id: '$metadata.format', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ])

    // Get daily stats for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyStats = await Log.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo },
          action: { $in: ['download', 'registration', 'login'] }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            action: '$action'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          stats: {
            $push: {
              action: '$_id.action',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({
      success: true,
      data: {
        userStats: {
          total: totalUsers,
          verified: verifiedUsers,
          google: googleUsers,
          admin: adminUsers,
          recent: recentUsers
        },
        downloadStats: {
          total: totalDownloads,
          recent: recentDownloads,
          popularFormats: popularFormats
        },
        dailyStats
      }
    })

    // Log admin action
    await logService.info('Admin viewed dashboard stats', req)
  } catch (error) {
    await logService.error('Admin dashboard stats error', error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
}

// Get all users with pagination
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const search = req.query.search || ''
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

    const query = search 
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {}

    const users = await User.find(query)
      .select('-password -otp')
      .sort({ [sortBy]: sortOrder })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const totalUsers = await User.countDocuments(query)

    res.json({
      success: true,
      data: {
        users,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
        hasNextPage: page < Math.ceil(totalUsers / limit),
        hasPrevPage: page > 1
      }
    })

    // Log admin action
    await logService.info('Admin viewed user list', req, { search, page })
  } catch (error) {
    await logService.error('Admin get users error', error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
}

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params
    const user = await User.findById(userId).select('-password -otp')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Get user's download history
    const downloads = await Log.find({ 
      userId: userId, 
      action: 'download' 
    }).sort({ timestamp: -1 }).limit(50)

    res.json({
      success: true,
      data: {
        user,
        downloads
      }
    })

    // Log admin action
    await logService.info('Admin viewed user details', req, { viewedUserId: userId })
  } catch (error) {
    await logService.error('Admin get user error', error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
}

// Update user
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { name, email, isVerified, isAdmin } = req.body

    // Prevent admin from removing their own admin status
    if (userId === req.user._id.toString() && isAdmin === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own admin privileges'
      })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, isVerified, isAdmin },
      { new: true, runValidators: true }
    ).select('-password -otp')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    })

    // Log admin action
    await logService.info('Admin updated user', req, { 
      updatedUserId: userId,
      changes: { name, email, isVerified, isAdmin }
    })
  } catch (error) {
    await logService.error('Admin update user error', error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
}

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params

    // Prevent admin from deleting their own account
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      })
    }

    const user = await User.findByIdAndDelete(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Also delete user's logs
    await Log.deleteMany({ userId: userId })

    res.json({
      success: true,
      message: 'User deleted successfully'
    })

    // Log admin action
    await logService.info('Admin deleted user', req, { 
      deletedUserId: userId,
      deletedUserEmail: user.email
    })
  } catch (error) {
    await logService.error('Admin delete user error', error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
}

// Get system logs
export const getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const level = req.query.level || ''
    const action = req.query.action || ''
    const startDate = req.query.startDate
    const endDate = req.query.endDate

    const query = {}
    
    if (level) query.level = level
    if (action) query.action = action
    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) query.timestamp.$gte = new Date(startDate)
      if (endDate) query.timestamp.$lte = new Date(endDate)
    }

    const logs = await Log.find(query)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const totalLogs = await Log.countDocuments(query)

    res.json({
      success: true,
      data: {
        logs,
        totalLogs,
        totalPages: Math.ceil(totalLogs / limit),
        currentPage: page,
        hasNextPage: page < Math.ceil(totalLogs / limit),
        hasPrevPage: page > 1
      }
    })

    // Log admin action
    await logService.info('Admin viewed system logs', req, { filters: query, page })
  } catch (error) {
    await logService.error('Admin get logs error', error, req)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    })
  }
} 