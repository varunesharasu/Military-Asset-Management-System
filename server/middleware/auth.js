const jwt = require("jsonwebtoken")
const User = require("../models/User")

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-password")

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Token is not valid" })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" })
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      })
    }
    next()
  }
}

const checkBaseAccess = (req, res, next) => {
  const { base } = req.params
  const { role, assignedBase } = req.user

  // Admin has access to all bases
  if (role === "admin") {
    return next()
  }

  // Base commanders and logistics officers can only access their assigned base
  if ((role === "base_commander" || role === "logistics_officer") && assignedBase === base) {
    return next()
  }

  return res.status(403).json({
    message: "Access denied. You can only access your assigned base.",
  })
}

module.exports = { auth, authorize, checkBaseAccess }
