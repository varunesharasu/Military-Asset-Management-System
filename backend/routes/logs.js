const express = require("express")
const Log = require("../models/Log")
const { authenticate, authorize } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/logs
// @desc    Get audit logs with filtering
// @access  Private (Admin only)
router.get("/", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const { userId, action, startDate, endDate, page = 1, limit = 50 } = req.query

    // Build query
    const query = {}

    if (userId) {
      query.userId = userId
    }

    if (action) {
      query.action = { $regex: action, $options: "i" }
    }

    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) query.timestamp.$gte = new Date(startDate)
      if (endDate) query.timestamp.$lte = new Date(endDate)
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get logs with populated user data
    const logs = await Log.find(query)
      .populate("userId", "username role baseId")
      .populate({
        path: "userId",
        populate: {
          path: "baseId",
          select: "name",
        },
      })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    // Get total count for pagination
    const total = await Log.countDocuments(query)

    // Get summary statistics
    const summary = await Log.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    res.json({
      logs,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        total,
        limit: Number.parseInt(limit),
      },
      summary,
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    res.status(500).json({ message: "Server error fetching audit logs" })
  }
})

// @route   GET /api/logs/actions
// @desc    Get unique actions for filtering
// @access  Private (Admin only)
router.get("/actions", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const actions = await Log.distinct("action")
    res.json({ actions: actions.sort() })
  } catch (error) {
    console.error("Error fetching log actions:", error)
    res.status(500).json({ message: "Server error fetching log actions" })
  }
})

// @route   GET /api/logs/stats
// @desc    Get audit log statistics
// @access  Private (Admin only)
router.get("/stats", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const { period = "30" } = req.query

    // Date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    // Get statistics
    const stats = await Log.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Get top users by activity
    const topUsers = await Log.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          username: "$user.username",
          role: "$user.role",
          count: 1,
        },
      },
    ])

    // Get top actions
    const topActions = await Log.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    res.json({
      dailyActivity: stats,
      topUsers,
      topActions,
    })
  } catch (error) {
    console.error("Error fetching audit statistics:", error)
    res.status(500).json({ message: "Server error fetching audit statistics" })
  }
})

module.exports = router
