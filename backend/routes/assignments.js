const express = require("express")
const Assignment = require("../models/Assignment")
const Equipment = require("../models/Equipment")
const Base = require("../models/Base")
const { authenticate, authorize } = require("../middleware/auth")
const { validate, assignmentSchema } = require("../middleware/validation")
const { logAction } = require("../middleware/logger")
const { updateInventory } = require("../utils/inventory")

const router = express.Router()

// @route   GET /api/assignments
// @desc    Get all assignments with filtering
// @access  Private (Admin, BaseCommander)
router.get("/", authenticate, authorize(["Admin", "BaseCommander"]), async (req, res) => {
  try {
    const { baseId, equipmentType, status, startDate, endDate, page = 1, limit = 20 } = req.query
    const user = req.user

    // Build query based on user role and filters
    const query = {}

    // Role-based filtering
    if (user.role === "Admin") {
      if (baseId) query.baseId = baseId
    } else {
      // BaseCommander can only see their base
      query.baseId = user.baseId._id
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

    // Equipment type filtering
    let equipmentIds = []
    if (equipmentType) {
      const equipment = await Equipment.find({ type: equipmentType })
      equipmentIds = equipment.map((e) => e._id)
      query.equipmentId = { $in: equipmentIds }
    }

    // Pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get assignments with populated data
    const assignments = await Assignment.find(query)
      .populate("baseId", "name location")
      .populate("equipmentId", "name type unit")
      .populate("createdBy", "username")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    // Get total count for pagination
    const total = await Assignment.countDocuments(query)

    // Calculate summary statistics
    const summary = await Assignment.aggregate([
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
      Assigned: { totalQuantity: 0, count: 0 },
      Expended: { totalQuantity: 0, count: 0 },
    }

    summary.forEach((item) => {
      summaryByStatus[item._id] = item
    })

    res.json({
      assignments,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        total,
        limit: Number.parseInt(limit),
      },
      summary: summaryByStatus,
    })
  } catch (error) {
    console.error("Error fetching assignments:", error)
    res.status(500).json({ message: "Server error fetching assignments" })
  }
})

// @route   POST /api/assignments
// @desc    Create a new assignment
// @access  Private (Admin, BaseCommander)
router.post("/", authenticate, authorize(["Admin", "BaseCommander"]), validate(assignmentSchema), async (req, res) => {
  try {
    const { baseId, equipmentId, personnel, quantity, status } = req.body
    const user = req.user

    // Validate base access
    if (user.role === "BaseCommander" && baseId !== user.baseId._id.toString()) {
      return res.status(403).json({ message: "You can only create assignments for your assigned base" })
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

    // Create assignment
    const assignment = new Assignment({
      baseId,
      equipmentId,
      personnel,
      quantity,
      status: status || "Assigned",
      date: new Date(),
      createdBy: user._id,
    })

    await assignment.save()

    // Update inventory
    await updateInventory(baseId, equipmentId)

    // Populate the created assignment for response
    await assignment.populate([
      { path: "baseId", select: "name location" },
      { path: "equipmentId", select: "name type unit" },
      { path: "createdBy", select: "username" },
    ])

    // Log the action
    await logAction(user._id, "ASSIGNMENT_CREATED", {
      assignmentId: assignment._id,
      baseId: base.name,
      equipment: equipment.name,
      personnel,
      quantity,
      status: assignment.status,
    })

    res.status(201).json({
      message: "Assignment created successfully",
      assignment,
    })
  } catch (error) {
    console.error("Error creating assignment:", error)
    res.status(500).json({ message: "Server error creating assignment" })
  }
})

// @route   PUT /api/assignments/:id/status
// @desc    Update assignment status (mark as expended)
// @access  Private (Admin, BaseCommander)
router.put("/:id/status", authenticate, authorize(["Admin", "BaseCommander"]), async (req, res) => {
  try {
    const assignmentId = req.params.id
    const { status } = req.body
    const user = req.user

    // Validate status
    if (!["Assigned", "Expended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const assignment = await Assignment.findById(assignmentId)
      .populate("baseId", "name")
      .populate("equipmentId", "name")

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" })
    }

    // Check access permissions
    if (user.role === "BaseCommander" && assignment.baseId._id.toString() !== user.baseId._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    const oldStatus = assignment.status
    assignment.status = status

    if (status === "Expended") {
      assignment.expendedDate = new Date()
    }

    await assignment.save()

    // Log the action
    await logAction(user._id, "ASSIGNMENT_STATUS_UPDATED", {
      assignmentId: assignment._id,
      baseId: assignment.baseId.name,
      equipment: assignment.equipmentId.name,
      personnel: assignment.personnel,
      oldStatus,
      newStatus: status,
    })

    res.json({
      message: "Assignment status updated successfully",
      assignment,
    })
  } catch (error) {
    console.error("Error updating assignment status:", error)
    res.status(500).json({ message: "Server error updating assignment status" })
  }
})

module.exports = router
