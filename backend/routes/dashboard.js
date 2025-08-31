const express = require("express")
const mongoose = require("mongoose")
const { authenticate, checkBaseAccess } = require("../middleware/auth")
const { logAction } = require("../middleware/logger")
const Purchase = require("../models/Purchase")
const Transfer = require("../models/Transfer")
const Assignment = require("../models/Assignment")
const Inventory = require("../models/Inventory")
const Equipment = require("../models/Equipment")
const Base = require("../models/Base")

const router = express.Router()

// @route   GET /api/dashboard/metrics
// @desc    Get dashboard metrics
// @access  Private
router.get("/metrics", authenticate, async (req, res) => {
  try {
    const { baseId, equipmentType, startDate, endDate } = req.query
    const user = req.user

    // Determine which bases to query based on user role
    let baseFilter = {}
    if (user.role === "Admin") {
      if (baseId) baseFilter = { _id: baseId }
    } else {
      // Base Commander and Logistics Officer can only see their base
      baseFilter = { _id: user.baseId._id }
    }

    const bases = await Base.find(baseFilter)
    const baseIds = bases.map((base) => base._id)

    // Date filter
    const dateFilter = {}
    if (startDate) dateFilter.$gte = new Date(startDate)
    if (endDate) dateFilter.$lte = new Date(endDate)

    // Equipment type filter
    let equipmentFilter = {}
    if (equipmentType) {
      const equipment = await Equipment.find({ type: equipmentType })
      equipmentFilter = { equipmentId: { $in: equipment.map((e) => e._id) } }
    }

    // Get inventory data
    const inventoryMatch = {
      baseId: { $in: baseIds },
      ...equipmentFilter,
    }

    const inventoryData = await Inventory.aggregate([
      { $match: inventoryMatch },
      {
        $lookup: {
          from: "equipment",
          localField: "equipmentId",
          foreignField: "_id",
          as: "equipment",
        },
      },
      { $unwind: "$equipment" },
      ...(equipmentType ? [{ $match: { "equipment.type": equipmentType } }] : []),
      {
        $group: {
          _id: null,
          totalOpeningBalance: { $sum: "$openingBalance" },
          totalClosingBalance: { $sum: "$closingBalance" },
          totalNetMovement: { $sum: "$netMovement" },
        },
      },
    ])

    // Get purchases data
    const purchaseMatch = {
      baseId: { $in: baseIds },
      ...equipmentFilter,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    }

    const purchaseData = await Purchase.aggregate([
      { $match: purchaseMatch },
      {
        $lookup: {
          from: "equipment",
          localField: "equipmentId",
          foreignField: "_id",
          as: "equipment",
        },
      },
      { $unwind: "$equipment" },
      ...(equipmentType ? [{ $match: { "equipment.type": equipmentType } }] : []),
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: "$quantity" },
          purchaseCount: { $sum: 1 },
        },
      },
    ])

    // Get transfers in
    const transferInMatch = {
      toBaseId: { $in: baseIds },
      status: "Completed",
      ...equipmentFilter,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    }

    const transferInData = await Transfer.aggregate([
      { $match: transferInMatch },
      {
        $lookup: {
          from: "equipment",
          localField: "equipmentId",
          foreignField: "_id",
          as: "equipment",
        },
      },
      { $unwind: "$equipment" },
      ...(equipmentType ? [{ $match: { "equipment.type": equipmentType } }] : []),
      {
        $group: {
          _id: null,
          totalTransfersIn: { $sum: "$quantity" },
          transferInCount: { $sum: 1 },
        },
      },
    ])

    // Get transfers out
    const transferOutMatch = {
      fromBaseId: { $in: baseIds },
      status: "Completed",
      ...equipmentFilter,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    }

    const transferOutData = await Transfer.aggregate([
      { $match: transferOutMatch },
      {
        $lookup: {
          from: "equipment",
          localField: "equipmentId",
          foreignField: "_id",
          as: "equipment",
        },
      },
      { $unwind: "$equipment" },
      ...(equipmentType ? [{ $match: { "equipment.type": equipmentType } }] : []),
      {
        $group: {
          _id: null,
          totalTransfersOut: { $sum: "$quantity" },
          transferOutCount: { $sum: 1 },
        },
      },
    ])

    // Get assignments data
    const assignmentMatch = {
      baseId: { $in: baseIds },
      ...equipmentFilter,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    }

    const assignmentData = await Assignment.aggregate([
      { $match: assignmentMatch },
      {
        $lookup: {
          from: "equipment",
          localField: "equipmentId",
          foreignField: "_id",
          as: "equipment",
        },
      },
      { $unwind: "$equipment" },
      ...(equipmentType ? [{ $match: { "equipment.type": equipmentType } }] : []),
      {
        $group: {
          _id: "$status",
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
    ])

    // Process results
    const inventory = inventoryData[0] || {
      totalOpeningBalance: 0,
      totalClosingBalance: 0,
      totalNetMovement: 0,
    }

    const purchases = purchaseData[0] || { totalPurchases: 0, purchaseCount: 0 }
    const transfersIn = transferInData[0] || { totalTransfersIn: 0, transferInCount: 0 }
    const transfersOut = transferOutData[0] || { totalTransfersOut: 0, transferOutCount: 0 }

    const assignedAssets = assignmentData.find((a) => a._id === "Assigned") || { totalQuantity: 0, count: 0 }
    const expendedAssets = assignmentData.find((a) => a._id === "Expended") || { totalQuantity: 0, count: 0 }

    // Calculate net movement breakdown
    const netMovementBreakdown = {
      purchases: purchases.totalPurchases,
      transfersIn: transfersIn.totalTransfersIn,
      transfersOut: transfersOut.totalTransfersOut,
      netMovement: purchases.totalPurchases + transfersIn.totalTransfersIn - transfersOut.totalTransfersOut,
    }

    const metrics = {
      openingBalance: inventory.totalOpeningBalance,
      closingBalance: inventory.totalClosingBalance,
      netMovement: inventory.totalNetMovement,
      assignedAssets: assignedAssets.totalQuantity,
      expendedAssets: expendedAssets.totalQuantity,
      netMovementBreakdown,
      counts: {
        purchases: purchases.purchaseCount,
        transfersIn: transfersIn.transferInCount,
        transfersOut: transfersOut.transferOutCount,
        assignments: assignedAssets.count,
        expenditures: expendedAssets.count,
      },
    }

    res.json({ metrics })
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error)
    res.status(500).json({ message: "Server error fetching dashboard metrics" })
  }
})

// @route   GET /api/dashboard/charts
// @desc    Get chart data for dashboard
// @access  Private
router.get("/charts", authenticate, async (req, res) => {
  try {
    const { baseId, equipmentType, period = "30" } = req.query
    const user = req.user

    // Determine which bases to query
    let baseFilter = {}
    if (user.role === "Admin") {
      if (baseId) baseFilter = { _id: baseId }
    } else {
      baseFilter = { _id: user.baseId._id }
    }

    const bases = await Base.find(baseFilter)
    const baseIds = bases.map((base) => base._id)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    // Equipment filter
    let equipmentFilter = {}
    if (equipmentType) {
      const equipment = await Equipment.find({ type: equipmentType })
      equipmentFilter = { equipmentId: { $in: equipment.map((e) => e._id) } }
    }

    // Get daily purchase data
    const dailyPurchases = await Purchase.aggregate([
      {
        $match: {
          baseId: { $in: baseIds },
          date: { $gte: startDate, $lte: endDate },
          ...equipmentFilter,
        },
      },
      {
        $lookup: {
          from: "equipment",
          localField: "equipmentId",
          foreignField: "_id",
          as: "equipment",
        },
      },
      { $unwind: "$equipment" },
      ...(equipmentType ? [{ $match: { "equipment.type": equipmentType } }] : []),
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          quantity: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Get daily transfer data
    const dailyTransfers = await Transfer.aggregate([
      {
        $match: {
          $or: [{ fromBaseId: { $in: baseIds } }, { toBaseId: { $in: baseIds } }],
          date: { $gte: startDate, $lte: endDate },
          status: "Completed",
          ...equipmentFilter,
        },
      },
      {
        $lookup: {
          from: "equipment",
          localField: "equipmentId",
          foreignField: "_id",
          as: "equipment",
        },
      },
      { $unwind: "$equipment" },
      ...(equipmentType ? [{ $match: { "equipment.type": equipmentType } }] : []),
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            type: {
              $cond: [{ $in: ["$toBaseId", baseIds] }, "in", "out"],
            },
          },
          quantity: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ])

    // Get equipment type distribution
    const equipmentDistribution = await Inventory.aggregate([
      {
        $match: {
          baseId: { $in: baseIds },
          closingBalance: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "equipment",
          localField: "equipmentId",
          foreignField: "_id",
          as: "equipment",
        },
      },
      { $unwind: "$equipment" },
      {
        $group: {
          _id: "$equipment.type",
          quantity: { $sum: "$closingBalance" },
          items: { $sum: 1 },
        },
      },
    ])

    res.json({
      dailyPurchases,
      dailyTransfers,
      equipmentDistribution,
    })
  } catch (error) {
    console.error("Error fetching chart data:", error)
    res.status(500).json({ message: "Server error fetching chart data" })
  }
})

// @route   GET /api/dashboard/recent-activities
// @desc    Get recent activities for dashboard
// @access  Private
router.get("/recent-activities", authenticate, async (req, res) => {
  try {
    const user = req.user
    const limit = Number.parseInt(req.query.limit) || 10

    // Determine which bases to query
    let baseFilter = {}
    if (user.role === "Admin") {
      // Admin can see all activities
    } else {
      baseFilter = { baseId: user.baseId._id }
    }

    // Get recent purchases
    const recentPurchases = await Purchase.find(baseFilter)
      .populate("baseId", "name")
      .populate("equipmentId", "name type")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .limit(limit)

    // Get recent transfers
    const transferFilter =
      user.role === "Admin"
        ? {}
        : {
            $or: [{ fromBaseId: user.baseId._id }, { toBaseId: user.baseId._id }],
          }

    const recentTransfers = await Transfer.find(transferFilter)
      .populate("fromBaseId", "name")
      .populate("toBaseId", "name")
      .populate("equipmentId", "name type")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .limit(limit)

    // Get recent assignments
    const recentAssignments = await Assignment.find(baseFilter)
      .populate("baseId", "name")
      .populate("equipmentId", "name type")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .limit(limit)

    // Combine and sort all activities
    const activities = [
      ...recentPurchases.map((p) => ({
        type: "purchase",
        id: p._id,
        date: p.createdAt,
        description: `Purchase of ${p.quantity} ${p.equipmentId.name}`,
        base: p.baseId.name,
        user: p.createdBy.username,
        quantity: p.quantity,
        equipment: p.equipmentId.name,
      })),
      ...recentTransfers.map((t) => ({
        type: "transfer",
        id: t._id,
        date: t.createdAt,
        description: `Transfer of ${t.quantity} ${t.equipmentId.name} from ${t.fromBaseId.name} to ${t.toBaseId.name}`,
        fromBase: t.fromBaseId.name,
        toBase: t.toBaseId.name,
        user: t.createdBy.username,
        quantity: t.quantity,
        equipment: t.equipmentId.name,
        status: t.status,
      })),
      ...recentAssignments.map((a) => ({
        type: "assignment",
        id: a._id,
        date: a.createdAt,
        description: `${a.status} ${a.quantity} ${a.equipmentId.name} to ${a.personnel}`,
        base: a.baseId.name,
        user: a.createdBy.username,
        quantity: a.quantity,
        equipment: a.equipmentId.name,
        personnel: a.personnel,
        status: a.status,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)

    res.json({ activities })
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    res.status(500).json({ message: "Server error fetching recent activities" })
  }
})

module.exports = router
