const express = require("express")
const { body, validationResult } = require("express-validator")
const { auth, authorize } = require("../middleware/auth")
const Transfer = require("../models/Transfer")
const Asset = require("../models/Asset")
const Balance = require("../models/Balance")

const router = express.Router()

// @route   GET /api/transfers
// @desc    Get all transfers with filters
// @access  Private (Admin, Base Commander, Logistics Officer)
router.get("/", auth, authorize("admin", "base_commander", "logistics_officer"), async (req, res) => {
  try {
    const { base, assetType, status, direction, startDate, endDate, page = 1, limit = 10 } = req.query
    const { role, assignedBase } = req.user

    // Build filter based on user role and permissions
    const filter = {}

    if (role === "admin") {
      // Admin can see all transfers
      if (base) {
        if (direction === "in") {
          filter.toBase = base
        } else if (direction === "out") {
          filter.fromBase = base
        } else {
          filter.$or = [{ fromBase: base }, { toBase: base }]
        }
      }
    } else {
      // Base commanders and logistics officers can only see transfers for their assigned base
      filter.$or = [{ fromBase: assignedBase }, { toBase: assignedBase }]
    }

    // Add additional filters
    if (assetType && assetType !== "all") filter.assetType = assetType
    if (status && status !== "all") filter.status = status

    // Date range filter
    if (startDate || endDate) {
      filter.transferDate = {}
      if (startDate) filter.transferDate.$gte = new Date(startDate)
      if (endDate) filter.transferDate.$lte = new Date(endDate)
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const transfers = await Transfer.find(filter)
      .populate("assetId", "name serialNumber")
      .populate("initiatedBy", "firstName lastName rank")
      .populate("approvedBy", "firstName lastName rank")
      .populate("receivedBy", "firstName lastName rank")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Transfer.countDocuments(filter)

    res.json({
      transfers,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        total,
        limit: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get transfers error:", error)
    res.status(500).json({ message: "Server error fetching transfers" })
  }
})

// @route   GET /api/transfers/:id
// @desc    Get single transfer
// @access  Private (Admin, Base Commander, Logistics Officer)
router.get("/:id", auth, authorize("admin", "base_commander", "logistics_officer"), async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate("assetId", "name serialNumber")
      .populate("initiatedBy", "firstName lastName rank")
      .populate("approvedBy", "firstName lastName rank")
      .populate("receivedBy", "firstName lastName rank")

    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" })
    }

    // Check if user can access this transfer
    const { role, assignedBase } = req.user
    if (role !== "admin" && transfer.fromBase !== assignedBase && transfer.toBase !== assignedBase) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(transfer)
  } catch (error) {
    console.error("Get transfer error:", error)
    res.status(500).json({ message: "Server error fetching transfer" })
  }
})

// @route   POST /api/transfers
// @desc    Create new transfer
// @access  Private (Admin, Base Commander, Logistics Officer)
router.post(
  "/",
  [
    auth,
    authorize("admin", "base_commander", "logistics_officer"),
    body("assetName").trim().notEmpty().withMessage("Asset name is required"),
    body("assetType")
      .isIn(["vehicle", "weapon", "ammunition", "equipment", "supplies"])
      .withMessage("Invalid asset type"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
    body("unit").trim().notEmpty().withMessage("Unit is required"),
    body("fromBase").trim().notEmpty().withMessage("From base is required"),
    body("toBase").trim().notEmpty().withMessage("To base is required"),
    body("transferDate").isISO8601().withMessage("Valid transfer date is required"),
    body("reason").trim().notEmpty().withMessage("Reason is required"),
    body("transportMethod").optional().isIn(["ground", "air", "sea", "rail"]).withMessage("Invalid transport method"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const {
        assetName,
        assetType,
        quantity,
        unit,
        fromBase,
        toBase,
        transferDate,
        expectedDeliveryDate,
        reason,
        notes,
        transportMethod,
        trackingNumber,
      } = req.body

      const { role, assignedBase } = req.user

      // Validate base access
      if (role !== "admin") {
        if (fromBase !== assignedBase && toBase !== assignedBase) {
          return res.status(403).json({
            message: "You can only create transfers involving your assigned base",
          })
        }
      }

      // Validate that from and to bases are different
      if (fromBase === toBase) {
        return res.status(400).json({
          message: "From base and to base cannot be the same",
        })
      }

      // Generate transfer ID
      const transferCount = await Transfer.countDocuments()
      const transferId = `TRF-${String(transferCount + 1).padStart(4, "0")}`

      // Create a placeholder asset ID (in a real system, this would reference an actual asset)
      const asset = new Asset({
        assetId: `AST-${Date.now()}`,
        name: assetName,
        type: assetType,
        category: assetType,
        unit: unit,
        currentBase: fromBase,
        status: "available",
      })
      await asset.save()

      const transfer = new Transfer({
        transferId,
        assetId: asset._id,
        assetName,
        assetType,
        quantity,
        unit,
        fromBase,
        toBase,
        transferDate: new Date(transferDate),
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        initiatedBy: req.user._id,
        reason,
        notes,
        transportMethod: transportMethod || "ground",
        trackingNumber,
        status: "pending",
      })

      await transfer.save()

      // Populate the response
      await transfer.populate([
        { path: "assetId", select: "name serialNumber" },
        { path: "initiatedBy", select: "firstName lastName rank" },
      ])

      res.status(201).json({
        message: "Transfer created successfully",
        transfer,
      })
    } catch (error) {
      console.error("Create transfer error:", error)
      res.status(500).json({ message: "Server error creating transfer" })
    }
  },
)

// @route   PUT /api/transfers/:id
// @desc    Update transfer
// @access  Private (Admin, Base Commander, Logistics Officer)
router.put(
  "/:id",
  [
    auth,
    authorize("admin", "base_commander", "logistics_officer"),
    body("assetName").optional().trim().notEmpty(),
    body("assetType").optional().isIn(["vehicle", "weapon", "ammunition", "equipment", "supplies"]),
    body("quantity").optional().isInt({ min: 1 }),
    body("unit").optional().trim().notEmpty(),
    body("transferDate").optional().isISO8601(),
    body("status").optional().isIn(["pending", "in_transit", "delivered", "cancelled"]),
    body("reason").optional().trim().notEmpty(),
    body("transportMethod").optional().isIn(["ground", "air", "sea", "rail"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const transfer = await Transfer.findById(req.params.id)
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" })
      }

      // Check access permissions
      const { role, assignedBase } = req.user
      if (role !== "admin" && transfer.fromBase !== assignedBase && transfer.toBase !== assignedBase) {
        return res.status(403).json({ message: "Access denied" })
      }

      // Update fields
      const updateFields = { ...req.body }

      // Set approval info if status is being approved
      if (updateFields.status === "in_transit" && transfer.status === "pending") {
        updateFields.approvedBy = req.user._id
      }

      // Set received info if status is being marked as delivered
      if (updateFields.status === "delivered" && transfer.status !== "delivered") {
        updateFields.receivedBy = req.user._id
        updateFields.actualDeliveryDate = new Date()
      }

      const updatedTransfer = await Transfer.findByIdAndUpdate(req.params.id, updateFields, {
        new: true,
        runValidators: true,
      })
        .populate("assetId", "name serialNumber")
        .populate("initiatedBy", "firstName lastName rank")
        .populate("approvedBy", "firstName lastName rank")
        .populate("receivedBy", "firstName lastName rank")

      res.json({
        message: "Transfer updated successfully",
        transfer: updatedTransfer,
      })
    } catch (error) {
      console.error("Update transfer error:", error)
      res.status(500).json({ message: "Server error updating transfer" })
    }
  },
)

// @route   DELETE /api/transfers/:id
// @desc    Delete transfer
// @access  Private (Admin only)
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" })
    }

    // Only allow deletion of pending transfers
    if (transfer.status !== "pending") {
      return res.status(400).json({
        message: "Only pending transfers can be deleted",
      })
    }

    await Transfer.findByIdAndDelete(req.params.id)

    res.json({ message: "Transfer deleted successfully" })
  } catch (error) {
    console.error("Delete transfer error:", error)
    res.status(500).json({ message: "Server error deleting transfer" })
  }
})

// @route   GET /api/transfers/stats/summary
// @desc    Get transfer statistics
// @access  Private (Admin, Base Commander, Logistics Officer)
router.get("/stats/summary", auth, authorize("admin", "base_commander", "logistics_officer"), async (req, res) => {
  try {
    const { role, assignedBase } = req.user
    const filter = {}

    if (role !== "admin") {
      filter.$or = [{ fromBase: assignedBase }, { toBase: assignedBase }]
    }

    const stats = await Transfer.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransfers: { $sum: 1 },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          inTransitCount: {
            $sum: { $cond: [{ $eq: ["$status", "in_transit"] }, 1, 0] },
          },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
    ])

    const result = stats[0] || {
      totalTransfers: 0,
      pendingCount: 0,
      inTransitCount: 0,
      deliveredCount: 0,
      cancelledCount: 0,
    }

    res.json(result)
  } catch (error) {
    console.error("Transfer stats error:", error)
    res.status(500).json({ message: "Server error fetching transfer statistics" })
  }
})

// @route   GET /api/transfers/bases/list
// @desc    Get list of available bases for transfers
// @access  Private (Admin, Base Commander, Logistics Officer)
router.get("/bases/list", auth, authorize("admin", "base_commander", "logistics_officer"), async (req, res) => {
  try {
    // Get unique bases from transfers and balances
    const transferBases = await Transfer.distinct("fromBase")
    const balanceBases = await Balance.distinct("base")

    // Combine and deduplicate
    const allBases = [
      ...new Set([...transferBases, ...balanceBases, "Fort Alpha", "Fort Beta", "Fort Charlie", "Fort Delta"]),
    ]

    res.json(allBases.sort())
  } catch (error) {
    console.error("Get bases error:", error)
    res.status(500).json({ message: "Server error fetching bases" })
  }
})

module.exports = router
