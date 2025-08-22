const mongoose = require("mongoose")

const assetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["vehicle", "weapon", "ammunition", "equipment", "supplies"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    unit: {
      type: String,
      required: true, // e.g., 'pieces', 'rounds', 'liters', 'kg'
    },
    currentBase: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "assigned", "maintenance", "expended"],
      default: "available",
    },
    condition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    serialNumber: {
      type: String,
      sparse: true,
    },
    manufacturer: {
      type: String,
    },
    model: {
      type: String,
    },
    acquisitionDate: {
      type: Date,
      default: Date.now,
    },
    lastMaintenanceDate: {
      type: Date,
    },
    nextMaintenanceDate: {
      type: Date,
    },
    value: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Asset", assetSchema)
