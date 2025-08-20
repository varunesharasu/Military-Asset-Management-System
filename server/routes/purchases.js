const express = require("express")
const { body, validationResult } = require("express-validator")
const { auth, authorize } = require("../middleware/auth")
const Purchase = require("../models/Purchase")
const Balance = require("../models/Balance")

const router = express.Router()

// @route   GET /api/purchases
// @desc    Get all purchases with filters
// @access  Private (Admin, Logistics Officer)
router.get("/", auth, authorize("admin", "logistics_officer"), async (req, res) => {
  try {
    const { base, assetType, status, startDate, endDate, page = 1, limit = 10 } = req.query
    const { role, assignedBase } = req.user

    // Build filter based on user role
    const filter = {}

    if (role === "admin") {
      // Admin can see all purchases
      if (base) filter.destinationBase = base
    } else {
      // Logistics officers can only see purchases for their assigned base
      filter.destinationBase = assignedBase
    }

    // Add additional filters
    if (assetType && assetType !== "all") filter.assetType = assetType
    if (status && status !== "all") filter.status = status

    // Date range filter
    if (startDate || endDate) {
      filter.purchaseDate = {}
      if (startDate) filter.purchaseDate.$gte = new Date(startDate)
      if (endDate) filter.purchaseDate.$lte = new Date(endDate)
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const purchases = await Purchase.find(filter)
      .populate("purchasedBy", "firstName lastName rank")
      .populate("approvedBy", "firstName lastName rank")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await Purchase.countDocuments(filter)

    res.json({
      purchases,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        total,
        limit: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get purchases error:", error)
    res.status(500).json({ message: "Server error fetching purchases" })
  }
})

// @route   GET /api/purchases/:id
// @desc    Get single purchase
// @access  Private (Admin, Logistics Officer)
router.get("/:id", auth, authorize("admin", "logistics_officer"), async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("purchasedBy", "firstName lastName rank")
      .populate("approvedBy", "firstName lastName rank")

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" })
    }

    // Check if user can access this purchase
    const { role, assignedBase } = req.user
    if (role !== "admin" && purchase.destinationBase !== assignedBase) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(purchase)
  } catch (error) {
    console.error("Get purchase error:", error)
    res.status(500).json({ message: "Server error fetching purchase" })
  }
})

// @route   POST /api/purchases
// @desc    Create new purchase
// @access  Private (Admin, Logistics Officer)
router.post(
  "/",
  [
    auth,
    authorize("admin", "logistics_officer"),
    body("assetType")
      .isIn(["vehicle", "weapon", "ammunition", "equipment", "supplies"])
      .withMessage("Invalid asset type"),
    body("assetName").trim().notEmpty().withMessage("Asset name is required"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
    body("unit").trim().notEmpty().withMessage("Unit is required"),
    body("unitPrice").isFloat({ min: 0 }).withMessage("Unit price must be a positive number"),
    body("vendor").trim().notEmpty().withMessage("Vendor is required"),
    body("purchaseDate").isISO8601().withMessage("Valid purchase date is required"),
    body("destinationBase").optional().trim(),
    body("notes").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { assetType, assetName, quantity, unit, unitPrice, vendor, purchaseDate, destinationBase, notes } = req.body

      const { role, assignedBase } = req.user

      // Determine destination base
      let finalDestinationBase = destinationBase
      if (role !== "admin") {
        // Non-admin users can only create purchases for their assigned base
        finalDestinationBase = assignedBase
      } else if (!destinationBase) {
        return res.status(400).json({ message: "Destination base is required for admin users" })
      }

      // Generate purchase ID
      const purchaseCount = await Purchase.countDocuments()
      const purchaseId = `PUR-${String(purchaseCount + 1).padStart(4, "0")}`

      // Calculate total amount
      const totalAmount = quantity * unitPrice

      const purchase = new Purchase({
        purchaseId,
        assetType,
        assetName,
        quantity,
        unit,
        unitPrice,
        totalAmount,
        destinationBase: finalDestinationBase,
        vendor,
        purchaseDate: new Date(purchaseDate),
        purchasedBy: req.user._id,
        notes,
        status: "pending",
      })

      await purchase.save()

      // Populate the response
      await purchase.populate("purchasedBy", "firstName lastName rank")

      res.status(201).json({
        message: "Purchase created successfully",
        purchase,
      })
    } catch (error) {
      console.error("Create purchase error:", error)
      res.status(500).json({ message: "Server error creating purchase" })
    }
  },
)

// @route   PUT /api/purchases/:id
// @desc    Update purchase
// @access  Private (Admin, Logistics Officer)
router.put(
  "/:id",
  [
    auth,
    authorize("admin", "logistics_officer"),
    body("assetType").optional().isIn(["vehicle", "weapon", "ammunition", "equipment", "supplies"]),
    body("assetName").optional().trim().notEmpty(),
    body("quantity").optional().isInt({ min: 1 }),
    body("unit").optional().trim().notEmpty(),
    body("unitPrice").optional().isFloat({ min: 0 }),
    body("vendor").optional().trim().notEmpty(),
    body("purchaseDate").optional().isISO8601(),
    body("status").optional().isIn(["pending", "approved", "delivered", "cancelled"]),
    body("notes").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const purchase = await Purchase.findById(req.params.id)
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" })
      }

      // Check access permissions
      const { role, assignedBase } = req.user
      if (role !== "admin" && purchase.destinationBase !== assignedBase) {
        return res.status(403).json({ message: "Access denied" })
      }

      // Update fields
      const updateFields = { ...req.body }

      // Recalculate total amount if quantity or unit price changed
      if (updateFields.quantity || updateFields.unitPrice) {
        const newQuantity = updateFields.quantity || purchase.quantity
        const newUnitPrice = updateFields.unitPrice || purchase.unitPrice
        updateFields.totalAmount = newQuantity * newUnitPrice
      }

      // Set approval info if status is being approved
      if (updateFields.status === "approved" && purchase.status !== "approved") {
        updateFields.approvedBy = req.user._id
      }

      const updatedPurchase = await Purchase.findByIdAndUpdate(req.params.id, updateFields, {
        new: true,
        runValidators: true,
      })
        .populate("purchasedBy", "firstName lastName rank")
        .populate("approvedBy", "firstName lastName rank")

      res.json({
        message: "Purchase updated successfully",
        purchase: updatedPurchase,
      })
    } catch (error) {
      console.error("Update purchase error:", error)
      res.status(500).json({ message: "Server error updating purchase" })
    }
  },
)

// @route   DELETE /api/purchases/:id
// @desc    Delete purchase
// @access  Private (Admin only)
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" })
    }

    // Only allow deletion of pending purchases
    if (purchase.status !== "pending") {
      return res.status(400).json({
        message: "Only pending purchases can be deleted",
      })
    }

    await Purchase.findByIdAndDelete(req.params.id)

    res.json({ message: "Purchase deleted successfully" })
  } catch (error) {
    console.error("Delete purchase error:", error)
    res.status(500).json({ message: "Server error deleting purchase" })
  }
})

// @route   GET /api/purchases/stats/summary
// @desc    Get purchase statistics
// @access  Private (Admin, Logistics Officer)
router.get("/stats/summary", auth, authorize("admin", "logistics_officer"), async (req, res) => {
  try {
    const { role, assignedBase } = req.user
    const filter = {}

    if (role !== "admin") {
      filter.destinationBase = assignedBase
    }

    const stats = await Purchase.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalValue: { $sum: "$totalAmount" },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
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
      totalPurchases: 0,
      totalValue: 0,
      pendingCount: 0,
      approvedCount: 0,
      deliveredCount: 0,
      cancelledCount: 0,
    }

    res.json(result)
  } catch (error) {
    console.error("Purchase stats error:", error)
    res.status(500).json({ message: "Server error fetching purchase statistics" })
  }
})

module.exports = router
