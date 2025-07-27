import { protect } from './authMiddleware.js'

// Admin access middleware
export const adminOnly = async (req, res, next) => {
  // First check if user is authenticated
  await protect(req, res, async () => {
    try {
      // Check if user exists and is admin
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
      }

      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        })
      }

      next()
    } catch (error) {
      console.error('Admin middleware error:', error)
      res.status(500).json({
        success: false,
        message: 'Server error'
      })
    }
  })
}
