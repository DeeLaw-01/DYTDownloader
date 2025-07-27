import express from 'express'
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getLogs
} from '../controllers/adminController.js'
import { adminOnly } from '../middleware/adminMiddleware.js'
import {
  requestSizeLimiter,
  handleValidationErrors
} from '../middleware/securityMiddleware.js'
import { body } from 'express-validator'

const router = express.Router()

// All admin routes require admin access
router.use(adminOnly)

// Dashboard stats
router.get('/stats', getDashboardStats)

// User management
router.get('/users', getUsers)
router.get('/users/:userId', getUserById)

// Update user validation
const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be boolean'),
  body('isAdmin').optional().isBoolean().withMessage('isAdmin must be boolean'),
  handleValidationErrors
]

router.put(
  '/users/:userId',
  requestSizeLimiter,
  updateUserValidation,
  updateUser
)
router.delete('/users/:userId', deleteUser)

// System logs
router.get('/logs', getLogs)

export default router
