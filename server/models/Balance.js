const mongoose = require("mongoose")

const balanceSchema = new mongoose.Schema(
  {
    base: {
      type: String,
      required: true,
    },
    assetType: {
      type: String,
      enum: ["vehicle", "weapon", "ammunition", "equipment", "supplies"],
      required: true,
    },
    assetName: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    openingBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    purchases: {
      type: Number,
      default: 0,
      min: 0,
    },
    transferIn: {
      type: Number,
      default: 0,
      min: 0,
    },
    transferOut: {
      type: Number,
      default: 0,
      min: 0,
    },
    assigned: {
      type: Number,
      default: 0,
      min: 0,
    },
    expended: {
      type: Number,
      default: 0,
      min: 0,
    },
    closingBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    netMovement: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for efficient queries
balanceSchema.index({ base: 1, assetType: 1, assetName: 1, date: 1 })

module.exports = mongoose.model("Balance", balanceSchema)
