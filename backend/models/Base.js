const mongoose = require("mongoose")

const baseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Base name is required"],
      unique: true,
      trim: true,
      maxlength: [100, "Base name cannot exceed 100 characters"],
    },
    location: {
      type: String,
      required: [true, "Base location is required"],
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Base", baseSchema)
