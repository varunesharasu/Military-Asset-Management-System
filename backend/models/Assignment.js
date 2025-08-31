const mongoose = require("mongoose")

const assignmentSchema = new mongoose.Schema(
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
    personnel: {
      type: String,
      required: [true, "Personnel name is required"],
      trim: true,
      maxlength: [100, "Personnel name cannot exceed 100 characters"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.01, "Quantity must be greater than 0"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: ["Assigned", "Expended"],
        message: "Status must be Assigned or Expended",
      },
      default: "Assigned",
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    expendedDate: {
      type: Date,
      validate: {
        validator: function (value) {
          // Only require expended date if status is "Expended"
          return this.status !== "Expended" || value != null
        },
        message: "Expended date is required when status is Expended",
      },
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

// Set expended date when status changes to "Expended"
assignmentSchema.pre("save", function (next) {
  if (this.status === "Expended" && !this.expendedDate) {
    this.expendedDate = new Date()
  }
  next()
})

// Index for better query performance
assignmentSchema.index({ baseId: 1, status: 1, date: -1 })
assignmentSchema.index({ personnel: 1, date: -1 })

module.exports = mongoose.model("Assignment", assignmentSchema)
