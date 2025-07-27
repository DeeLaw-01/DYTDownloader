import User from "../models/User.js";

// Get all users - can be accessed by anyone (as per requirements)
export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users but exclude sensitive information
    const users = await User.find().select("-password -otp");
    res.json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin middleware - commented out as requested
// Will be implemented later
/*
export const isAdmin = async (req, res, next) => {
  try {
    // Check if user exists and is an admin
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // This would check an isAdmin field that would be added to the User model later
    // if (!user.isAdmin) {
    //   return res.status(403).json({ message: 'Not authorized as admin' })
    // }

    next()
  } catch (error) {
    console.error('Admin middleware error:', error)
    res.status(401).json({ message: 'Not authorized as admin' })
  }
}
*/

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -otp");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { name, profilePicture } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (profilePicture) user.profilePicture = profilePicture;

    const updatedUser = await user.save();

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isGoogle: updatedUser.isGoogle,
      onBoardingComplete: updatedUser.onBoardingComplete,
      profilePicture: updatedUser.profilePicture,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
