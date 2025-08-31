const express = require("express")
const Purchase = require("../models/Purchase")
const Equipment = require("../models/Equipment")
const Base = require("../models/Base")
const { authenticate, authorize, checkBaseAccess } = require("../middleware/auth")
const { validate, purchaseSchema } = require("../middleware/validation")
const { logAction } = require("../middleware/logger")
const { updateInventory } = require("../utils/inventory")

const router = express.Router()

// @route   GET /api/purchases
// @desc    Get all purchases with filtering
// @access  Private (Admin, LogisticsOfficer)
router.get("/", authenticate, authorize(["Admin", "LogisticsOfficer"]), async (req, res) => {
  try {
    const { baseId, equipmentType, startDate, endDate, page = 1, limit = 20 } = req.query
    const user = req.user

    // Build query based on user role and filters
    const query = {}

    // Role-based filtering
    if (user.role === "Admin") {
      if (baseId) query.baseId = baseId
    } else {
      // LogisticsOfficer can only see their base
      query.baseId = user.baseId._id
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

    // Get purchases with populated data
    const purchases = await Purchase.find(query)
      .populate("baseId", "name location")
      .populate("equipmentId", "name type unit")
      .populate("createdBy", "username")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    // Get total count for pagination
    const total = await Purchase.countDocuments(query)

    // Calculate summary statistics
    const summary = await Purchase.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
          totalPurchases: { $sum: 1 },
          avgQuantity: { $avg: "$quantity" },
        },
      },
    ])

    res.json({
      purchases,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        total,
        limit: Number.parseInt(limit),
      },
      summary: summary[0] || { totalQuantity: 0, totalPurchases: 0, avgQuantity: 0 },
    })
  } catch (error) {
    console.error("Error fetching purchases:", error)
    res.status(500).json({ message: "Server error fetching purchases" })
  }
})

// @route   POST /api/purchases
// @desc    Create a new purchase
// @access  Private (Admin, LogisticsOfficer)
router.post("/", authenticate, authorize(["Admin", "LogisticsOfficer"]), validate(purchaseSchema), async (req, res) => {
  try {
    const { baseId, equipmentId, quantity, date } = req.body
    const user = req.user

    // Validate base access
    if (user.role === "LogisticsOfficer" && baseId !== user.baseId._id.toString()) {
      return res.status(403).json({ message: "You can only create purchases for your assigned base" })
    }

    // Validate base exists
    const base = await Base.findById(baseId)
    if (!base) {
      return res.status(404).json({ message: "Base not found" })
    }

    // Validate equipment exists
    const equipment = await Equipment.findById(equipmentId)
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" })
    }

    // Create purchase
    const purchase = new Purchase({
      baseId,
      equipmentId,
      quantity,
      date: date || new Date(),
      createdBy: user._id,
    })

    await purchase.save()

    // Update inventory
    await updateInventory(baseId, equipmentId)

    // Populate the created purchase for response
    await purchase.populate([
      { path: "baseId", select: "name location" },
      { path: "equipmentId", select: "name type unit" },
      { path: "createdBy", select: "username" },
    ])

    // Log the action
    await logAction(user._id, "PURCHASE_CREATED", {
      purchaseId: purchase._id,
      baseId: base.name,
      equipment: equipment.name,
      quantity,
      date: purchase.date,
    })

    res.status(201).json({
      message: "Purchase created successfully",
      purchase,
    })
  } catch (error) {
    console.error("Error creating purchase:", error)
    res.status(500).json({ message: "Server error creating purchase" })
  }
})

// @route   GET /api/purchases/:id
// @desc    Get a specific purchase
// @access  Private (Admin, LogisticsOfficer)
router.get("/:id", authenticate, authorize(["Admin", "LogisticsOfficer"]), async (req, res) => {
  try {
    const purchaseId = req.params.id
    const user = req.user

    const purchase = await Purchase.findById(purchaseId)
      .populate("baseId", "name location")
      .populate("equipmentId", "name type unit")
      .populate("createdBy", "username")

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" })
    }

    // Check access permissions
    if (user.role === "LogisticsOfficer" && purchase.baseId._id.toString() !== user.baseId._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json({ purchase })
  } catch (error) {
    console.error("Error fetching purchase:", error)
    res.status(500).json({ message: "Server error fetching purchase" })
  }
})

// @route   PUT /api/purchases/:id
// @desc    Update a purchase
// @access  Private (Admin, LogisticsOfficer)
router.put(
  "/:id",
  authenticate,
  authorize(["Admin", "LogisticsOfficer"]),
  validate(purchaseSchema),
  async (req, res) => {
    try {
      const purchaseId = req.params.id
      const { baseId, equipmentId, quantity, date } = req.body
      const user = req.user

      const purchase = await Purchase.findById(purchaseId)
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" })
      }

      // Check access permissions
      if (user.role === "LogisticsOfficer") {
        if (purchase.baseId.toString() !== user.baseId._id.toString() || baseId !== user.baseId._id.toString()) {
          return res.status(403).json({ message: "Access denied" })
        }
      }

      // Store old values for inventory update
      const oldBaseId = purchase.baseId
      const oldEquipmentId = purchase.equipmentId

      // Validate new base and equipment
      const base = await Base.findById(baseId)
      if (!base) {
        return res.status(404).json({ message: "Base not found" })
      }

      const equipment = await Equipment.findById(equipmentId)
      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" })
      }

      // Update purchase
      purchase.baseId = baseId
      purchase.equipmentId = equipmentId
      purchase.quantity = quantity
      purchase.date = date || purchase.date

      await purchase.save()

      // Update inventory for both old and new base/equipment combinations
      if (oldBaseId.toString() !== baseId || oldEquipmentId.toString() !== equipmentId) {
        await updateInventory(oldBaseId, oldEquipmentId)
      }
      await updateInventory(baseId, equipmentId)

      // Populate for response
      await purchase.populate([
        { path: "baseId", select: "name location" },
        { path: "equipmentId", select: "name type unit" },
        { path: "createdBy", select: "username" },
      ])

      // Log the action
      await logAction(user._id, "PURCHASE_UPDATED", {
        purchaseId: purchase._id,
        baseId: base.name,
        equipment: equipment.name,
        quantity,
        date: purchase.date,
      })

      res.json({
        message: "Purchase updated successfully",
        purchase,
      })
    } catch (error) {
      console.error("Error updating purchase:", error)
      res.status(500).json({ message: "Server error updating purchase" })
    }
  },
)

// @route   DELETE /api/purchases/:id
// @desc    Delete a purchase
// @access  Private (Admin only)
router.delete("/:id", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const purchaseId = req.params.id

    const purchase = await Purchase.findById(purchaseId).populate("baseId equipmentId")
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" })
    }

    // Store values for inventory update
    const baseId = purchase.baseId._id
    const equipmentId = purchase.equipmentId._id

    await Purchase.findByIdAndDelete(purchaseId)

    // Update inventory
    await updateInventory(baseId, equipmentId)

    // Log the action
    await logAction(req.user._id, "PURCHASE_DELETED", {
      purchaseId,
      baseId: purchase.baseId.name,
      equipment: purchase.equipmentId.name,
      quantity: purchase.quantity,
    })

    res.json({ message: "Purchase deleted successfully" })
  } catch (error) {
    console.error("Error deleting purchase:", error)
    res.status(500).json({ message: "Server error deleting purchase" })
  }
})

// @route   GET /api/purchases/summary/stats
// @desc    Get purchase statistics
// @access  Private (Admin, LogisticsOfficer)
router.get("/summary/stats", authenticate, authorize(["Admin", "LogisticsOfficer"]), async (req, res) => {
  try {
    const { baseId, period = "30" } = req.query
    const user = req.user

    // Build base filter
    let baseFilter = {}
    if (user.role === "Admin") {
      if (baseId) baseFilter = { baseId }
    } else {
      baseFilter = { baseId: user.baseId._id }
    }

    // Date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    // Get statistics
    const stats = await Purchase.aggregate([
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
          _id: "$equipment.type",
          totalQuantity: { $sum: "$quantity" },
          totalPurchases: { $sum: 1 },
          avgQuantity: { $avg: "$quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
    ])

    res.json({ stats })
  } catch (error) {
    console.error("Error fetching purchase statistics:", error)
    res.status(500).json({ message: "Server error fetching purchase statistics" })
  }
})

module.exports = router
