const express = require("express")
const Equipment = require("../models/Equipment")
const { authenticate, authorize } = require("../middleware/auth")
const { logAction } = require("../middleware/logger")

const router = express.Router()

// @route   GET /api/equipment
// @desc    Get all equipment
// @access  Private (All roles)
router.get("/", authenticate, async (req, res) => {
  try {
    const { type } = req.query

    const query = {}
    if (type) {
      query.type = type
    }

    const equipment = await Equipment.find(query).sort({ type: 1, name: 1 })

    res.json({ equipment })
  } catch (error) {
    console.error("Error fetching equipment:", error)
    res.status(500).json({ message: "Server error fetching equipment" })
  }
})

// @route   POST /api/equipment
// @desc    Create new equipment
// @access  Private (Admin only)
router.post("/", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const { name, type, unit } = req.body

    // Validate input
    if (!name || !type || !unit) {
      return res.status(400).json({ message: "Name, type, and unit are required" })
    }

    // Check if equipment already exists
    const existingEquipment = await Equipment.findOne({ name, type })
    if (existingEquipment) {
      return res.status(400).json({ message: "Equipment with this name and type already exists" })
    }

    // Create new equipment
    const equipment = new Equipment({ name, type, unit })
    await equipment.save()

    // Log the action
    await logAction(req.user._id, "EQUIPMENT_CREATED", {
      equipmentId: equipment._id,
      name: equipment.name,
      type: equipment.type,
      unit: equipment.unit,
    })

    res.status(201).json({
      message: "Equipment created successfully",
      equipment,
    })
  } catch (error) {
    console.error("Error creating equipment:", error)
    res.status(500).json({ message: "Server error creating equipment" })
  }
})

// @route   PUT /api/equipment/:id
// @desc    Update equipment
// @access  Private (Admin only)
router.put("/:id", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const { name, type, unit } = req.body
    const equipmentId = req.params.id

    // Validate input
    if (!name || !type || !unit) {
      return res.status(400).json({ message: "Name, type, and unit are required" })
    }

    // Check if another equipment with the same name and type exists
    const existingEquipment = await Equipment.findOne({
      name,
      type,
      _id: { $ne: equipmentId },
    })
    if (existingEquipment) {
      return res.status(400).json({ message: "Equipment with this name and type already exists" })
    }

    // Update equipment
    const equipment = await Equipment.findByIdAndUpdate(
      equipmentId,
      { name, type, unit },
      { new: true, runValidators: true },
    )

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" })
    }

    // Log the action
    await logAction(req.user._id, "EQUIPMENT_UPDATED", {
      equipmentId: equipment._id,
      name: equipment.name,
      type: equipment.type,
      unit: equipment.unit,
    })

    res.json({
      message: "Equipment updated successfully",
      equipment,
    })
  } catch (error) {
    console.error("Error updating equipment:", error)
    res.status(500).json({ message: "Server error updating equipment" })
  }
})

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment
// @access  Private (Admin only)
router.delete("/:id", authenticate, authorize(["Admin"]), async (req, res) => {
  try {
    const equipmentId = req.params.id

    const equipment = await Equipment.findByIdAndDelete(equipmentId)

    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" })
    }

    // Log the action
    await logAction(req.user._id, "EQUIPMENT_DELETED", {
      equipmentId: equipment._id,
      name: equipment.name,
      type: equipment.type,
      unit: equipment.unit,
    })

    res.json({ message: "Equipment deleted successfully" })
  } catch (error) {
    console.error("Error deleting equipment:", error)
    res.status(500).json({ message: "Server error deleting equipment" })
  }
})

module.exports = router
