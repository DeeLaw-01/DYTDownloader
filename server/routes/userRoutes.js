import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route - Get all users (accessible by anyone)
router.get("/", getAllUsers);

// Admin route - commented out as requested
// Will be implemented later when admin functionality is needed
/*
router.get('/admin', protect, isAdmin, getAllUsers)
*/

// Protected routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

export default router;
