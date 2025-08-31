const mongoose = require("mongoose")

const logSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
      maxlength: [100, "Action cannot exceed 100 characters"],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Details are required"],
    },
    timestamp: {
      type: Date,
      required: [true, "Timestamp is required"],
      default: Date.now,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
logSchema.index({ userId: 1, timestamp: -1 })
logSchema.index({ action: 1, timestamp: -1 })
logSchema.index({ timestamp: -1 })

module.exports = mongoose.model("Log", logSchema)
