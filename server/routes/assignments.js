const express = require("express")
const { auth, authorize } = require("../middleware/auth")
const Assignment = require("../models/Assignment")
const Asset = require("../models/Asset")

const router = express.Router()

// Get all assignments with filtering
router.get("/", auth, authorize("admin", "base_commander", "logistics_officer"), async (req, res) => {
  try {
    const { base, assetType, status, personnelName, dateFrom, dateTo, page = 1, limit = 10 } = req.query

    const filter = {}

    // Role-based filtering
    if (req.user.role === "base_commander") {
      filter.base = req.user.base
    } else if (req.user.role === "logistics_officer") {
      filter.base = req.user.base
    }

    // Apply additional filters
    if (base && req.user.role === "admin") filter.base = base
    if (assetType) filter.assetType = assetType
    if (status) filter.status = status
    if (personnelName) filter.personnelName = { $regex: personnelName, $options: "i" }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.assignedDate = {}
      if (dateFrom) filter.assignedDate.$gte = new Date(dateFrom)
      if (dateTo) filter.assignedDate.$lte = new Date(dateTo)
    }

    const skip = (page - 1) * limit
    const assignments = await Assignment.find(filter)
      .sort({ assignedDate: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Assignment.countDocuments(filter)

    res.json({
      assignments,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get assignment statistics
router.get("/stats", auth, authorize("admin", "base_commander", "logistics_officer"), async (req, res) => {
  try {
    const matchFilter = {}

    // Role-based filtering
    if (req.user.role === "base_commander" || req.user.role === "logistics_officer") {
      matchFilter.base = req.user.base
    }

    const stats = await Assignment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalAssignments: { $sum: 1 },
          activeAssignments: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          expendedAssets: {
            $sum: { $cond: [{ $eq: ["$status", "expended"] }, 1, 0] },
          },
          returnedAssets: {
            $sum: { $cond: [{ $eq: ["$status", "returned"] }, 1, 0] },
          },
          totalQuantity: { $sum: "$quantity" },
          expendedQuantity: {
            $sum: { $cond: [{ $eq: ["$status", "expended"] }, "$quantity", 0] },
          },
        },
      },
    ])

    const statusBreakdown = await Assignment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          quantity: { $sum: "$quantity" },
        },
      },
    ])

    const assetTypeBreakdown = await Assignment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$assetType",
          count: { $sum: 1 },
          quantity: { $sum: "$quantity" },
        },
      },
    ])

    res.json({
      overview: stats[0] || {
        totalAssignments: 0,
        activeAssignments: 0,
        expendedAssets: 0,
        returnedAssets: 0,
        totalQuantity: 0,
        expendedQuantity: 0,
      },
      statusBreakdown,
      assetTypeBreakdown,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create new assignment
router.post("/", auth, authorize("admin", "base_commander"), async (req, res) => {
  try {
    const {
      assetType,
      assetName,
      quantity,
      personnelName,
      personnelRank,
      personnelId,
      purpose,
      expectedReturnDate,
      notes,
    } = req.body

    // Validation
    if (!assetType || !assetName || !quantity || !personnelName || !personnelRank || !personnelId) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Check asset availability
    const asset = await Asset.findOne({
      assetType,
      assetName,
      base: req.user.role === "admin" ? req.body.base : req.user.base,
    })

    if (!asset || asset.availableQuantity < quantity) {
      return res.status(400).json({ message: "Insufficient asset quantity available" })
    }

    const assignment = new Assignment({
      assetType,
      assetName,
      quantity: Number.parseInt(quantity),
      personnelName,
      personnelRank,
      personnelId,
      purpose,
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      notes,
      base: req.user.role === "admin" ? req.body.base : req.user.base,
      assignedBy: req.user.id,
      assignedDate: new Date(),
      status: "active",
    })

    await assignment.save()

    // Update asset availability
    asset.availableQuantity -= quantity
    asset.assignedQuantity += quantity
    await asset.save()

    res.status(201).json(assignment)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Update assignment status (return or expend)
router.put("/:id/status", auth, authorize("admin", "base_commander"), async (req, res) => {
  try {
    const { status, returnQuantity, expendQuantity, notes } = req.body

    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" })
    }

    // Role-based access check
    if (req.user.role === "base_commander" && assignment.base !== req.user.base) {
      return res.status(403).json({ message: "Access denied" })
    }

    const asset = await Asset.findOne({
      assetType: assignment.assetType,
      assetName: assignment.assetName,
      base: assignment.base,
    })

    if (status === "returned") {
      const returnQty = returnQuantity || assignment.quantity
      assignment.returnedQuantity = returnQty
      assignment.returnedDate = new Date()
      assignment.status = "returned"

      // Update asset quantities
      if (asset) {
        asset.assignedQuantity -= returnQty
        asset.availableQuantity += returnQty
        await asset.save()
      }
    } else if (status === "expended") {
      const expendQty = expendQuantity || assignment.quantity
      assignment.expendedQuantity = expendQty
      assignment.expendedDate = new Date()
      assignment.status = "expended"

      // Update asset quantities
      if (asset) {
        asset.assignedQuantity -= expendQty
        asset.expendedQuantity += expendQty
        await asset.save()
      }
    } else if (status === "partial_return") {
      const returnQty = returnQuantity || 0
      const expendQty = expendQuantity || 0

      if (returnQty + expendQty !== assignment.quantity) {
        return res.status(400).json({ message: "Return and expend quantities must equal assigned quantity" })
      }

      assignment.returnedQuantity = returnQty
      assignment.expendedQuantity = expendQty
      assignment.returnedDate = new Date()
      assignment.expendedDate = new Date()
      assignment.status = "partial_return"

      // Update asset quantities
      if (asset) {
        asset.assignedQuantity -= assignment.quantity
        asset.availableQuantity += returnQty
        asset.expendedQuantity += expendQty
        await asset.save()
      }
    }

    if (notes) assignment.notes = notes
    assignment.updatedBy = req.user.id
    assignment.updatedDate = new Date()

    await assignment.save()
    res.json(assignment)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Get assignment by ID
router.get("/:id", auth, authorize("admin", "base_commander", "logistics_officer"), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" })
    }

    // Role-based access check
    if (
      (req.user.role === "base_commander" || req.user.role === "logistics_officer") &&
      assignment.base !== req.user.base
    ) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(assignment)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delete assignment (admin only)
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" })
    }

    // Only allow deletion of active assignments
    if (assignment.status !== "active") {
      return res.status(400).json({ message: "Can only delete active assignments" })
    }

    // Restore asset quantities
    const asset = await Asset.findOne({
      assetType: assignment.assetType,
      assetName: assignment.assetName,
      base: assignment.base,
    })

    if (asset) {
      asset.assignedQuantity -= assignment.quantity
      asset.availableQuantity += assignment.quantity
      await asset.save()
    }

    await Assignment.findByIdAndDelete(req.params.id)
    res.json({ message: "Assignment deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
