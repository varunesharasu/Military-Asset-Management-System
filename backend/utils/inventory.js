const Inventory = require("../models/Inventory")
const Purchase = require("../models/Purchase")
const Transfer = require("../models/Transfer")
const Assignment = require("../models/Assignment")

// Update inventory after transactions
const updateInventory = async (baseId, equipmentId) => {
  try {
    // Get or create inventory record
    let inventory = await Inventory.findOne({ baseId, equipmentId })

    if (!inventory) {
      inventory = new Inventory({
        baseId,
        equipmentId,
        openingBalance: 0,
        closingBalance: 0,
      })
    }

    // Calculate total purchases
    const purchases = await Purchase.aggregate([
      { $match: { baseId, equipmentId } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ])
    const totalPurchases = purchases[0]?.total || 0

    // Calculate transfers in
    const transfersIn = await Transfer.aggregate([
      { $match: { toBaseId: baseId, equipmentId, status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ])
    const totalTransfersIn = transfersIn[0]?.total || 0

    // Calculate transfers out
    const transfersOut = await Transfer.aggregate([
      { $match: { fromBaseId: baseId, equipmentId, status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ])
    const totalTransfersOut = transfersOut[0]?.total || 0

    // Calculate assignments (both assigned and expended)
    const assignments = await Assignment.aggregate([
      { $match: { baseId, equipmentId } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ])
    const totalAssignments = assignments[0]?.total || 0

    // Calculate closing balance
    const closingBalance =
      inventory.openingBalance + totalPurchases + totalTransfersIn - totalTransfersOut - totalAssignments

    // Update inventory
    inventory.closingBalance = Math.max(0, closingBalance)
    inventory.lastUpdated = new Date()

    await inventory.save()

    return inventory
  } catch (error) {
    console.error("Error updating inventory:", error)
    throw error
  }
}

// Get inventory summary for dashboard
const getInventorySummary = async (baseId, equipmentType = null) => {
  try {
    const matchStage = { baseId }
    if (equipmentType) {
      // We'll need to populate equipment to filter by type
    }

    const inventory = await Inventory.find(matchStage).populate("equipmentId").populate("baseId")

    let filteredInventory = inventory
    if (equipmentType) {
      filteredInventory = inventory.filter((item) => item.equipmentId.type === equipmentType)
    }

    const summary = {
      totalOpeningBalance: filteredInventory.reduce((sum, item) => sum + item.openingBalance, 0),
      totalClosingBalance: filteredInventory.reduce((sum, item) => sum + item.closingBalance, 0),
      totalNetMovement: filteredInventory.reduce((sum, item) => sum + item.netMovement, 0),
      itemCount: filteredInventory.length,
    }

    return summary
  } catch (error) {
    console.error("Error getting inventory summary:", error)
    throw error
  }
}

module.exports = {
  updateInventory,
  getInventorySummary,
}
