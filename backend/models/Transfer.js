const mongoose = require("mongoose")

const transferSchema = new mongoose.Schema(
  {
    fromBaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Base",
      required: [true, "From base ID is required"],
    },
    toBaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Base",
      required: [true, "To base ID is required"],
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
    status: {
      type: String,
      enum: ["Pending", "In Transit", "Completed", "Cancelled"],
      default: "Pending",
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

// Validation to prevent transfer to same base
transferSchema.pre("save", function (next) {
  if (this.fromBaseId.equals(this.toBaseId)) {
    next(new Error("Cannot transfer to the same base"))
  }
  next()
})

// Index for better query performance
transferSchema.index({ fromBaseId: 1, date: -1 })
transferSchema.index({ toBaseId: 1, date: -1 })
transferSchema.index({ status: 1, date: -1 })

module.exports = mongoose.model("Transfer", transferSchema)
