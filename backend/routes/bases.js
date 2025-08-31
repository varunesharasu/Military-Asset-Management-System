const express = require("express")
const Base = require("../models/Base")
const { authenticate, authorize } = require("../middleware/auth")
const { logAction } = require("../middleware/logger")

const router = express.Router()

// @route   GET /api/bases
// @desc    Get all bases
// @access  Private (Admin, BaseCommander, LogisticsOfficer)
router.get("/", authenticate, async (req, res) => {
  try {
    let bases

    // Admin can see all bases
    if (req.user.role === "Admin") {
      bases = await Base.find().sort({ name: 1 })
    } else {
      // Base Commander and Logistics Officer can only see their base
      bases = await Base.find({ _id: req.user.baseId }).sort({ name: 1 })
    }

    res.json({ bases })
  } catch (error) {
    console.error("Error fetching bases:", error)
    res.status(500).json({ message: "Server error fetching bases" })
  }
})

// @route   POST /api/bases
// @desc    Create a new base
// @access  Private (Admin only)
router.post("/", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const { name, location } = req.body

    // Validate input
    if (!name || !location) {
      return res.status(400).json({ message: "Name and location are required" })
    }

    // Check if base already exists
    const existingBase = await Base.findOne({ name })
    if (existingBase) {
      return res.status(400).json({ message: "Base with this name already exists" })
    }

    // Create new base
    const base = new Base({ name, location })
    await base.save()

    // Log the action
    await logAction(req.user._id, "BASE_CREATED", {
      baseId: base._id,
      name: base.name,
      location: base.location,
    })

    res.status(201).json({
      message: "Base created successfully",
      base,
    })
  } catch (error) {
    console.error("Error creating base:", error)
    res.status(500).json({ message: "Server error creating base" })
  }
})

// @route   PUT /api/bases/:id
// @desc    Update a base
// @access  Private (Admin only)
router.put("/:id", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const { name, location } = req.body
    const baseId = req.params.id

    // Validate input
    if (!name || !location) {
      return res.status(400).json({ message: "Name and location are required" })
    }

    // Check if another base with the same name exists
    const existingBase = await Base.findOne({ name, _id: { $ne: baseId } })
    if (existingBase) {
      return res.status(400).json({ message: "Base with this name already exists" })
    }

    // Update base
    const base = await Base.findByIdAndUpdate(baseId, { name, location }, { new: true, runValidators: true })

    if (!base) {
      return res.status(404).json({ message: "Base not found" })
    }

    // Log the action
    await logAction(req.user._id, "BASE_UPDATED", {
      baseId: base._id,
      name: base.name,
      location: base.location,
    })

    res.json({
      message: "Base updated successfully",
      base,
    })
  } catch (error) {
    console.error("Error updating base:", error)
    res.status(500).json({ message: "Server error updating base" })
  }
})

// @route   DELETE /api/bases/:id
// @desc    Delete a base
// @access  Private (Admin only)
router.delete("/:id", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const baseId = req.params.id

    const base = await Base.findByIdAndDelete(baseId)

    if (!base) {
      return res.status(404).json({ message: "Base not found" })
    }

    // Log the action
    await logAction(req.user._id, "BASE_DELETED", {
      baseId: base._id,
      name: base.name,
      location: base.location,
    })

    res.json({ message: "Base deleted successfully" })
  } catch (error) {
    console.error("Error deleting base:", error)
    res.status(500).json({ message: "Server error deleting base" })
  }
})

module.exports = router
