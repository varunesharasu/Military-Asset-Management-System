const mongoose = require("mongoose")

const assignmentSchema = new mongoose.Schema(
  {
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
    personnelName: {
      type: String,
      required: true,
    },
    personnelRank: {
      type: String,
      required: true,
    },
    personnelId: {
      type: String,
      required: true,
    },
    base: {
      type: String,
      required: true,
    },
    assignedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedReturnDate: {
      type: Date,
    },
    returnedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "returned", "expended", "partial_return"],
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
    returnedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    expendedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    expendedDate: {
      type: Date,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Assignment", assignmentSchema)
