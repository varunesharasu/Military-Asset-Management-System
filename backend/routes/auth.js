const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const Base = require("../models/Base")
const { authenticate } = require("../middleware/auth")
const { validate, userSchemas } = require("../middleware/validation")
const { logAction } = require("../middleware/logger")

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  })
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (Admin only in production)
router.post("/register", validate(userSchemas.register), async (req, res) => {
  try {
    const { username, password, role, baseId } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" })
    }

    // Validate base exists if baseId is provided
    if (baseId) {
      const base = await Base.findById(baseId)
      if (!base) {
        return res.status(400).json({ message: "Invalid base ID" })
      }
    }

    // Create new user
    const user = new User({
      username,
      password,
      role,
      baseId: baseId || null,
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    // Log the registration
    await logAction(user._id, "USER_REGISTERED", {
      username: user.username,
      role: user.role,
      baseId: user.baseId,
    })

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        baseId: user.baseId,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error during registration" })
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validate(userSchemas.login), async (req, res) => {
  try {
    const { username, password } = req.body

    // Find user and populate base information
    const user = await User.findOne({ username }).populate("baseId")
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate token
    const token = generateToken(user._id)

    // Log the login
    await logAction(user._id, "USER_LOGIN", {
      username: user.username,
      loginTime: new Date(),
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        baseId: user.baseId,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
})

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("baseId")

    res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        baseId: user.baseId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    res.status(500).json({ message: "Server error fetching profile" })
  }
})

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", authenticate, async (req, res) => {
  try {
    const { username } = req.body
    const userId = req.user._id

    // Check if new username is already taken by another user
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } })
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" })
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username: username || req.user.username },
      { new: true, runValidators: true },
    ).populate("baseId")

    // Log the profile update
    await logAction(userId, "PROFILE_UPDATED", {
      oldUsername: req.user.username,
      newUsername: updatedUser.username,
    })

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
        baseId: updatedUser.baseId,
      },
    })
  } catch (error) {
    console.error("Profile update error:", error)
    res.status(500).json({ message: "Server error updating profile" })
  }
})

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" })
    }

    // Get user with password
    const user = await User.findById(req.user._id)

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    // Log the password change
    await logAction(user._id, "PASSWORD_CHANGED", {
      username: user.username,
      changeTime: new Date(),
    })

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Password change error:", error)
    res.status(500).json({ message: "Server error changing password" })
  }
})

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post("/logout", authenticate, async (req, res) => {
  try {
    // Log the logout
    await logAction(req.user._id, "USER_LOGOUT", {
      username: req.user.username,
      logoutTime: new Date(),
    })

    res.json({ message: "Logout successful" })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({ message: "Server error during logout" })
  }
})

// @route   GET /api/auth/verify-token
// @desc    Verify JWT token validity
// @access  Private
router.get("/verify-token", authenticate, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      role: req.user.role,
      baseId: req.user.baseId,
    },
  })
})

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
// @access  Private (Admin only)
router.get("/users", authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." })
    }

    const users = await User.find({}, "username role baseId createdAt").populate("baseId", "name").sort({ username: 1 })

    res.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ message: "Server error fetching users" })
  }
})

module.exports = router
