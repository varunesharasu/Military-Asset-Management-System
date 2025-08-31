const Log = require("../models/Log")

// Request logging middleware
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`)
  next()
}

// Action logging utility
const logAction = async (userId, action, details) => {
  try {
    const log = new Log({
      userId,
      action,
      details,
      timestamp: new Date(),
    })
    await log.save()
  } catch (error) {
    console.error("Logging error:", error)
  }
}

module.exports = {
  requestLogger,
  logAction,
}
