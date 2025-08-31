const mongoose = require("mongoose")

const inventorySchema = new mongoose.Schema(
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
    openingBalance: {
      type: Number,
      required: [true, "Opening balance is required"],
      min: [0, "Opening balance cannot be negative"],
      default: 0,
    },
    closingBalance: {
      type: Number,
      required: [true, "Closing balance is required"],
      min: [0, "Closing balance cannot be negative"],
      default: 0,
    },
    netMovement: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Compound unique index to prevent duplicate inventory records
inventorySchema.index({ baseId: 1, equipmentId: 1 }, { unique: true })

// Calculate net movement before saving
inventorySchema.pre("save", function (next) {
  this.netMovement = this.closingBalance - this.openingBalance
  this.lastUpdated = new Date()
  next()
})

module.exports = mongoose.model("Inventory", inventorySchema)
