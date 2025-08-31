const mongoose = require("mongoose")

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Equipment name is required"],
      trim: true,
      maxlength: [100, "Equipment name cannot exceed 100 characters"],
    },
    type: {
      type: String,
      required: [true, "Equipment type is required"],
      enum: {
        values: ["Vehicle", "Weapon", "Ammunition"],
        message: "Equipment type must be Vehicle, Weapon, or Ammunition",
      },
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      trim: true,
      maxlength: [20, "Unit cannot exceed 20 characters"],
      // Examples: count, liters, kg, rounds, etc.
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for better query performance
equipmentSchema.index({ type: 1, name: 1 })

module.exports = mongoose.model("Equipment", equipmentSchema)
