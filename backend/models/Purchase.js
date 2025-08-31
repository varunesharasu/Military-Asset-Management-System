const mongoose = require("mongoose")

const purchaseSchema = new mongoose.Schema(
  {
    baseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Base",
      required: [true, "Base ID is required"],
    },
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: [true, "Equipment ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.01, "Quantity must be greater than 0"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user is required"],
    },
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
purchaseSchema.index({ baseId: 1, date: -1 })
purchaseSchema.index({ equipmentId: 1, date: -1 })

module.exports = mongoose.model("Purchase", purchaseSchema)
