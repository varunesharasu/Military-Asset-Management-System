const express = require("express")
const { auth, checkBaseAccess } = require("../middleware/auth")
const Balance = require("../models/Balance")
const Purchase = require("../models/Purchase")
const Transfer = require("../models/Transfer")
const Assignment = require("../models/Assignment")
const Asset = require("../models/Asset")

const router = express.Router()

// @route   GET /api/dashboard/metrics
// @desc    Get dashboard metrics with filters
// @access  Private
router.get("/metrics", auth, async (req, res) => {
  try {
    const { base, assetType, startDate, endDate } = req.query
    const { role, assignedBase } = req.user

    // Build filter based on user role and permissions
    const baseFilter = {}
    if (role === "admin") {
      // Admin can see all bases
      if (base) baseFilter.base = base
    } else {
      // Base commanders and logistics officers can only see their assigned base
      baseFilter.base = assignedBase
    }

    // Add asset type filter
    if (assetType && assetType !== "all") {
      baseFilter.assetType = assetType
    }

    // Add date filter
    const dateFilter = {}
    if (startDate || endDate) {
      dateFilter.date = {}
      if (startDate) dateFilter.date.$gte = new Date(startDate)
      if (endDate) dateFilter.date.$lte = new Date(endDate)
    }

    const filter = { ...baseFilter, ...dateFilter }

    // Get balance metrics
    const balances = await Balance.find(filter).sort({ date: -1 })

    // Calculate aggregated metrics
    const metrics = {
      totalAssets: 0,
      openingBalance: 0,
      closingBalance: 0,
      netMovement: 0,
      purchases: 0,
      transferIn: 0,
      transferOut: 0,
      assigned: 0,
      expended: 0,
      assetsByType: {},
      recentActivity: [],
    }

    // Aggregate balance data
    const latestBalances = new Map()
    balances.forEach((balance) => {
      const key = `${balance.base}-${balance.assetType}-${balance.assetName}`
      if (!latestBalances.has(key) || balance.date > latestBalances.get(key).date) {
        latestBalances.set(key, balance)
      }
    })

    latestBalances.forEach((balance) => {
      metrics.openingBalance += balance.openingBalance
      metrics.closingBalance += balance.closingBalance
      metrics.netMovement += balance.netMovement
      metrics.purchases += balance.purchases
      metrics.transferIn += balance.transferIn
      metrics.transferOut += balance.transferOut
      metrics.assigned += balance.assigned
      metrics.expended += balance.expended

      // Group by asset type
      if (!metrics.assetsByType[balance.assetType]) {
        metrics.assetsByType[balance.assetType] = {
          openingBalance: 0,
          closingBalance: 0,
          netMovement: 0,
          purchases: 0,
          transferIn: 0,
          transferOut: 0,
          assigned: 0,
          expended: 0,
        }
      }

      const typeMetrics = metrics.assetsByType[balance.assetType]
      typeMetrics.openingBalance += balance.openingBalance
      typeMetrics.closingBalance += balance.closingBalance
      typeMetrics.netMovement += balance.netMovement
      typeMetrics.purchases += balance.purchases
      typeMetrics.transferIn += balance.transferIn
      typeMetrics.transferOut += balance.transferOut
      typeMetrics.assigned += balance.assigned
      typeMetrics.expended += balance.expended
    })

    metrics.totalAssets = metrics.closingBalance

    // Get recent activity (last 10 records)
    const recentPurchases = await Purchase.find(baseFilter)
      .populate("purchasedBy", "firstName lastName rank")
      .sort({ createdAt: -1 })
      .limit(5)

    const recentTransfers = await Transfer.find({
      $or: [{ fromBase: baseFilter.base }, { toBase: baseFilter.base }],
    })
      .populate("initiatedBy", "firstName lastName rank")
      .sort({ createdAt: -1 })
      .limit(5)

    metrics.recentActivity = [
      ...recentPurchases.map((p) => ({
        type: "purchase",
        id: p._id,
        description: `Purchase of ${p.quantity} ${p.assetName}`,
        date: p.createdAt,
        user: p.purchasedBy,
        status: p.status,
      })),
      ...recentTransfers.map((t) => ({
        type: "transfer",
        id: t._id,
        description: `Transfer of ${t.quantity} ${t.assetName} from ${t.fromBase} to ${t.toBase}`,
        date: t.createdAt,
        user: t.initiatedBy,
        status: t.status,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)

    res.json(metrics)
  } catch (error) {
    console.error("Dashboard metrics error:", error)
    res.status(500).json({ message: "Server error fetching dashboard metrics" })
  }
})

// @route   GET /api/dashboard/movement-details
// @desc    Get detailed movement breakdown
// @access  Private
router.get("/movement-details", auth, async (req, res) => {
  try {
    const { base, assetType, startDate, endDate } = req.query
    const { role, assignedBase } = req.user

    // Build filter based on user role
    const baseFilter = {}
    if (role === "admin") {
      if (base) baseFilter.base = base
    } else {
      baseFilter.base = assignedBase
    }

    if (assetType && assetType !== "all") {
      baseFilter.assetType = assetType
    }

    const dateFilter = {}
    if (startDate || endDate) {
      dateFilter.date = {}
      if (startDate) dateFilter.date.$gte = new Date(startDate)
      if (endDate) dateFilter.date.$lte = new Date(endDate)
    }

    const filter = { ...baseFilter, ...dateFilter }

    // Get detailed purchases
    const purchases = await Purchase.find({
      destinationBase: baseFilter.base,
      ...(assetType && assetType !== "all" && { assetType }),
      ...(startDate && { purchaseDate: { $gte: new Date(startDate) } }),
      ...(endDate && { purchaseDate: { $lte: new Date(endDate) } }),
    })
      .populate("purchasedBy", "firstName lastName rank")
      .sort({ purchaseDate: -1 })

    // Get detailed transfers in
    const transfersIn = await Transfer.find({
      toBase: baseFilter.base,
      ...(assetType && assetType !== "all" && { assetType }),
      ...(startDate && { transferDate: { $gte: new Date(startDate) } }),
      ...(endDate && { transferDate: { $lte: new Date(endDate) } }),
    })
      .populate("initiatedBy", "firstName lastName rank")
      .sort({ transferDate: -1 })

    // Get detailed transfers out
    const transfersOut = await Transfer.find({
      fromBase: baseFilter.base,
      ...(assetType && assetType !== "all" && { assetType }),
      ...(startDate && { transferDate: { $gte: new Date(startDate) } }),
      ...(endDate && { transferDate: { $lte: new Date(endDate) } }),
    })
      .populate("initiatedBy", "firstName lastName rank")
      .sort({ transferDate: -1 })

    res.json({
      purchases: purchases.map((p) => ({
        id: p._id,
        assetName: p.assetName,
        quantity: p.quantity,
        unit: p.unit,
        totalAmount: p.totalAmount,
        vendor: p.vendor,
        date: p.purchaseDate,
        status: p.status,
        purchasedBy: p.purchasedBy,
      })),
      transfersIn: transfersIn.map((t) => ({
        id: t._id,
        assetName: t.assetName,
        quantity: t.quantity,
        unit: t.unit,
        fromBase: t.fromBase,
        date: t.transferDate,
        status: t.status,
        initiatedBy: t.initiatedBy,
      })),
      transfersOut: transfersOut.map((t) => ({
        id: t._id,
        assetName: t.assetName,
        quantity: t.quantity,
        unit: t.unit,
        toBase: t.toBase,
        date: t.transferDate,
        status: t.status,
        initiatedBy: t.initiatedBy,
      })),
    })
  } catch (error) {
    console.error("Movement details error:", error)
    res.status(500).json({ message: "Server error fetching movement details" })
  }
})

// @route   GET /api/dashboard/bases
// @desc    Get list of available bases
// @access  Private
router.get("/bases", auth, async (req, res) => {
  try {
    const { role, assignedBase } = req.user

    if (role === "admin") {
      // Admin can see all bases
      const bases = await Balance.distinct("base")
      res.json(bases.sort())
    } else {
      // Other roles can only see their assigned base
      res.json([assignedBase])
    }
  } catch (error) {
    console.error("Get bases error:", error)
    res.status(500).json({ message: "Server error fetching bases" })
  }
})

// @route   GET /api/dashboard/asset-types
// @desc    Get list of available asset types
// @access  Private
router.get("/asset-types", auth, async (req, res) => {
  try {
    const assetTypes = ["vehicle", "weapon", "ammunition", "equipment", "supplies"]
    res.json(assetTypes)
  } catch (error) {
    console.error("Get asset types error:", error)
    res.status(500).json({ message: "Server error fetching asset types" })
  }
})

module.exports = router
