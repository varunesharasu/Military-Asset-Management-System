const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).populate("baseId")

    if (!user) {
      return res.status(401).json({ message: "Invalid token." })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: "Invalid token." })
  }
}

// Role-based authorization middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Access denied. User not authenticated." })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." })
    }

    next()
  }
}

// Base access control middleware
const checkBaseAccess = (req, res, next) => {
  const { baseId } = req.params
  const user = req.user

  // Admin has access to all bases
  if (user.role === "Admin") {
    return next()
  }

  // Base Commander and Logistics Officer can only access their own base
  if (user.role === "BaseCommander" || user.role === "LogisticsOfficer") {
    if (user.baseId._id.toString() !== baseId) {
      return res.status(403).json({ message: "Access denied. You can only access your assigned base." })
    }
  }

  next()
}

module.exports = {
  authenticate,
  authorize,
  checkBaseAccess,
}
