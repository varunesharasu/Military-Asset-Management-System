const express = require("express")
const Transfer = require("../models/Transfer")
const Equipment = require("../models/Equipment")
const Base = require("../models/Base")
const Inventory = require("../models/Inventory")
const { authenticate, authorize } = require("../middleware/auth")
const { validate, transferSchema } = require("../middleware/validation")
const { logAction } = require("../middleware/logger")
const { updateInventory } = require("../utils/inventory")

const router = express.Router()

// @route   GET /api/transfers
// @desc    Get all transfers with filtering
// @access  Private (Admin, LogisticsOfficer)
router.get("/", authenticate, authorize(["Admin", "LogisticsOfficer"]), async (req, res) => {
  try {
    const { baseId, equipmentType, status, startDate, endDate, page = 1, limit = 20 } = req.query
    const user = req.user

    // Build query based on user role and filters
    const query = {}

    // Role-based filtering
    if (user.role === "Admin") {
      if (baseId) {
        query.$or = [{ fromBaseId: baseId }, { toBaseId: baseId }]
      }
    } else {
      // LogisticsOfficer can only see transfers involving their base
      query.$or = [{ fromBaseId: user.baseId._id }, { toBaseId: user.baseId._id }]
    }

    // Status filtering
    if (status) {
      query.status = status
    }

    // Date filtering
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    // Equipment type filtering (requires lookup)
    let equipmentIds = []
    if (equipmentType) {
      const equipment = await Equipment.find({ type: equipmentType })
      equipmentIds = equipment.map((e) => e._id)
      query.equipmentId = { $in: equipmentIds }
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get transfers with populated data
    const transfers = await Transfer.find(query)
      .populate("fromBaseId", "name location")
      .populate("toBaseId", "name location")
      .populate("equipmentId", "name type unit")
      .populate("createdBy", "username")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    // Get total count for pagination
    const total = await Transfer.countDocuments(query)

    // Calculate summary statistics
    const summary = await Transfer.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
    ])

    const summaryByStatus = {
      Pending: { totalQuantity: 0, count: 0 },
      "In Transit": { totalQuantity: 0, count: 0 },
      Completed: { totalQuantity: 0, count: 0 },
      Cancelled: { totalQuantity: 0, count: 0 },
    }

    summary.forEach((item) => {
      summaryByStatus[item._id] = item
    })

    res.json({
      transfers,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        total,
        limit: Number.parseInt(limit),
      },
      summary: summaryByStatus,
    })
  } catch (error) {
    console.error("Error fetching transfers:", error)
    res.status(500).json({ message: "Server error fetching transfers" })
  }
})

// @route   POST /api/transfers
// @desc    Create a new transfer
// @access  Private (Admin, LogisticsOfficer)
router.post("/", authenticate, authorize(["Admin", "LogisticsOfficer"]), validate(transferSchema), async (req, res) => {
  try {
    const { fromBaseId, toBaseId, equipmentId, quantity, date } = req.body
    const user = req.user

    // Validate base access for LogisticsOfficer
    if (user.role === "LogisticsOfficer") {
      const userBaseId = user.baseId._id.toString()
      if (fromBaseId !== userBaseId && toBaseId !== userBaseId) {
        return res.status(403).json({ message: "You can only create transfers involving your assigned base" })
      }
    }

    // Validate bases exist
    const fromBase = await Base.findById(fromBaseId)
    const toBase = await Base.findById(toBaseId)
    if (!fromBase || !toBase) {
      return res.status(404).json({ message: "One or both bases not found" })
    }

    // Validate equipment exists
    const equipment = await Equipment.findById(equipmentId)
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" })
    }

    // Check if source base has sufficient inventory
    const inventory = await Inventory.findOne({ baseId: fromBaseId, equipmentId })
    if (!inventory || inventory.closingBalance < quantity) {
      return res.status(400).json({
        message: `Insufficient inventory. Available: ${inventory?.closingBalance || 0}, Requested: ${quantity}`,
      })
    }

    // Create transfer
    const transfer = new Transfer({
      fromBaseId,
      toBaseId,
      equipmentId,
      quantity,
      date: date || new Date(),
      status: "Pending",
      createdBy: user._id,
    })

    await transfer.save()

    // Populate the created transfer for response
    await transfer.populate([
      { path: "fromBaseId", select: "name location" },
      { path: "toBaseId", select: "name location" },
      { path: "equipmentId", select: "name type unit" },
      { path: "createdBy", select: "username" },
    ])

    // Log the action
    await logAction(user._id, "TRANSFER_CREATED", {
      transferId: transfer._id,
      fromBase: fromBase.name,
      toBase: toBase.name,
      equipment: equipment.name,
      quantity,
      status: transfer.status,
    })

    res.status(201).json({
      message: "Transfer created successfully",
      transfer,
    })
  } catch (error) {
    console.error("Error creating transfer:", error)
    res.status(500).json({ message: "Server error creating transfer" })
  }
})

// @route   PUT /api/transfers/:id/status
// @desc    Update transfer status
// @access  Private (Admin, LogisticsOfficer)
router.put("/:id/status", authenticate, authorize(["Admin", "LogisticsOfficer"]), async (req, res) => {
  try {
    const transferId = req.params.id
    const { status } = req.body
    const user = req.user

    // Validate status
    const validStatuses = ["Pending", "In Transit", "Completed", "Cancelled"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const transfer = await Transfer.findById(transferId)
      .populate("fromBaseId", "name")
      .populate("toBaseId", "name")
      .populate("equipmentId", "name")

    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" })
    }

    // Check access permissions
    if (user.role === "LogisticsOfficer") {
      const userBaseId = user.baseId._id.toString()
      if (transfer.fromBaseId._id.toString() !== userBaseId && transfer.toBaseId._id.toString() !== userBaseId) {
        return res.status(403).json({ message: "Access denied" })
      }
    }

    // Prevent status changes from completed or cancelled
    if (transfer.status === "Completed" || transfer.status === "Cancelled") {
      return res.status(400).json({ message: `Cannot change status from ${transfer.status}` })
    }

    const oldStatus = transfer.status
    transfer.status = status

    await transfer.save()

    // Update inventory when transfer is completed
    if (status === "Completed" && oldStatus !== "Completed") {
      await updateInventory(transfer.fromBaseId._id, transfer.equipmentId._id)
      await updateInventory(transfer.toBaseId._id, transfer.equipmentId._id)
    }

    // Log the action
    await logAction(user._id, "TRANSFER_STATUS_UPDATED", {
      transferId: transfer._id,
      fromBase: transfer.fromBaseId.name,
      toBase: transfer.toBaseId.name,
      equipment: transfer.equipmentId.name,
      oldStatus,
      newStatus: status,
    })

    res.json({
      message: "Transfer status updated successfully",
      transfer,
    })
  } catch (error) {
    console.error("Error updating transfer status:", error)
    res.status(500).json({ message: "Server error updating transfer status" })
  }
})

// @route   PUT /api/transfers/:id
// @desc    Update a transfer (only if pending)
// @access  Private (Admin, LogisticsOfficer)
router.put(
  "/:id",
  authenticate,
  authorize(["Admin", "LogisticsOfficer"]),
  validate(transferSchema),
  async (req, res) => {
    try {
      const transferId = req.params.id
      const { fromBaseId, toBaseId, equipmentId, quantity, date } = req.body
      const user = req.user

      const transfer = await Transfer.findById(transferId)
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" })
      }

      // Only allow editing pending transfers
      if (transfer.status !== "Pending") {
        return res.status(400).json({ message: "Can only edit pending transfers" })
      }

      // Check access permissions
      if (user.role === "LogisticsOfficer") {
        const userBaseId = user.baseId._id.toString()
        if (
          transfer.fromBaseId.toString() !== userBaseId &&
          transfer.toBaseId.toString() !== userBaseId &&
          fromBaseId !== userBaseId &&
          toBaseId !== userBaseId
        ) {
          return res.status(403).json({ message: "Access denied" })
        }
      }

      // Validate new bases and equipment
      const fromBase = await Base.findById(fromBaseId)
      const toBase = await Base.findById(toBaseId)
      const equipment = await Equipment.findById(equipmentId)

      if (!fromBase || !toBase || !equipment) {
        return res.status(404).json({ message: "Base or equipment not found" })
      }

      // Check inventory for new configuration
      const inventory = await Inventory.findOne({ baseId: fromBaseId, equipmentId })
      if (!inventory || inventory.closingBalance < quantity) {
        return res.status(400).json({
          message: `Insufficient inventory. Available: ${inventory?.closingBalance || 0}, Requested: ${quantity}`,
        })
      }

      // Update transfer
      transfer.fromBaseId = fromBaseId
      transfer.toBaseId = toBaseId
      transfer.equipmentId = equipmentId
      transfer.quantity = quantity
      transfer.date = date || transfer.date

      await transfer.save()

      // Populate for response
      await transfer.populate([
        { path: "fromBaseId", select: "name location" },
        { path: "toBaseId", select: "name location" },
        { path: "equipmentId", select: "name type unit" },
        { path: "createdBy", select: "username" },
      ])

      // Log the action
      await logAction(user._id, "TRANSFER_UPDATED", {
        transferId: transfer._id,
        fromBase: fromBase.name,
        toBase: toBase.name,
        equipment: equipment.name,
        quantity,
      })

      res.json({
        message: "Transfer updated successfully",
        transfer,
      })
    } catch (error) {
      console.error("Error updating transfer:", error)
      res.status(500).json({ message: "Server error updating transfer" })
    }
  },
)

// @route   DELETE /api/transfers/:id
// @desc    Delete a transfer (Admin only, pending transfers only)
// @access  Private (Admin only)
router.delete("/:id", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const transferId = req.params.id

    const transfer = await Transfer.findById(transferId).populate("fromBaseId toBaseId equipmentId")
    if (!transfer) {
      return res.status(404).json({ message: "Transfer not found" })
    }

    // Only allow deleting pending transfers
    if (transfer.status !== "Pending") {
      return res.status(400).json({ message: "Can only delete pending transfers" })
    }

    await Transfer.findByIdAndDelete(transferId)

    // Log the action
    await logAction(req.user._id, "TRANSFER_DELETED", {
      transferId,
      fromBase: transfer.fromBaseId.name,
      toBase: transfer.toBaseId.name,
      equipment: transfer.equipmentId.name,
      quantity: transfer.quantity,
    })

    res.json({ message: "Transfer deleted successfully" })
  } catch (error) {
    console.error("Error deleting transfer:", error)
    res.status(500).json({ message: "Server error deleting transfer" })
  }
})

// @route   GET /api/transfers/summary/stats
// @desc    Get transfer statistics
// @access  Private (Admin, LogisticsOfficer)
router.get("/summary/stats", authenticate, authorize(["Admin", "LogisticsOfficer"]), async (req, res) => {
  try {
    const { baseId, period = "30" } = req.query
    const user = req.user

    // Build base filter
    let baseFilter = {}
    if (user.role === "Admin") {
      if (baseId) {
        baseFilter = { $or: [{ fromBaseId: baseId }, { toBaseId: baseId }] }
      }
    } else {
      baseFilter = { $or: [{ fromBaseId: user.baseId._id }, { toBaseId: user.baseId._id }] }
    }

    // Date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    // Get statistics
    const stats = await Transfer.aggregate([
      {
        $match: {
          ...baseFilter,
          date: { $gte: startDate, $lte: endDate },
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
          _id: {
            type: "$equipment.type",
            status: "$status",
          },
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.type": 1, "_id.status": 1 } },
    ])

    res.json({ stats })
  } catch (error) {
    console.error("Error fetching transfer statistics:", error)
    res.status(500).json({ message: "Server error fetching transfer statistics" })
  }
})

module.exports = router
