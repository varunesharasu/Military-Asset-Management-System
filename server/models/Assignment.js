const mongoose = require("mongoose")

const assignmentSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: String,
      required: true,
      unique: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    assetName: {
      type: String,
      required: true,
    },
    assetType: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      required: true,
    },
    assignedTo: {
      personnelId: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rank: {
        type: String,
        required: true,
      },
      unit: {
        type: String,
        required: true,
      },
    },
    base: {
      type: String,
      required: true,
    },
    assignmentDate: {
      type: Date,
      required: true,
    },
    expectedReturnDate: {
      type: Date,
    },
    actualReturnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "returned", "expended", "lost", "damaged"],
      default: "active",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    expendedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    expendedDate: {
      type: Date,
    },
    expendedReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Assignment", assignmentSchema)
