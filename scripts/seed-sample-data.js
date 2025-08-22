// Sample data seeding script for testing dashboard functionality
const mongoose = require("mongoose")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config({ path: "../server/.env" })

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("Connected to MongoDB")

    // Import models
    const userSchema = require("../server/models/User")
    const User = mongoose.model("User", userSchema)
    const Asset = require("../server/models/Asset")
    const Purchase = require("../server/models/Purchase")
    const Transfer = require("../server/models/Transfer")
    const Assignment = require("../server/models/Assignment")
    const Balance = require("../server/models/Balance")

    // Clear existing data
    await User.deleteMany({})
    await Asset.deleteMany({})
    await Purchase.deleteMany({})
    await Transfer.deleteMany({})
    await Assignment.deleteMany({})
    await Balance.deleteMany({})
    console.log("Cleared existing data")

    // Create sample users
    const users = await User.create([
      {
        username: "admin",
        email: "admin@military.gov",
        password: "admin123",
        role: "admin",
        firstName: "John",
        lastName: "Smith",
        rank: "Colonel",
      },
      {
        username: "base1_commander",
        email: "commander1@military.gov",
        password: "commander123",
        role: "base_commander",
        assignedBase: "Base Alpha",
        firstName: "Sarah",
        lastName: "Johnson",
        rank: "Major",
      },
      {
        username: "logistics1",
        email: "logistics1@military.gov",
        password: "logistics123",
        role: "logistics_officer",
        assignedBase: "Base Alpha",
        firstName: "Mike",
        lastName: "Davis",
        rank: "Captain",
      },
    ])

    // Create sample assets
    const assets = await Asset.create([
      {
        assetId: "AST-001",
        name: "M4 Carbine",
        type: "weapon",
        category: "Assault Rifle",
        unit: "pieces",
        currentBase: "Base Alpha",
        totalQuantity: 150,
        availableQuantity: 120,
        assignedQuantity: 30,
        expendedQuantity: 0,
        manufacturer: "Colt",
        model: "M4A1",
        value: 1200,
      },
      {
        assetId: "AST-002",
        name: "5.56mm Rounds",
        type: "ammunition",
        category: "Rifle Ammunition",
        unit: "rounds",
        currentBase: "Base Alpha",
        totalQuantity: 60000,
        availableQuantity: 25000,
        assignedQuantity: 20000,
        expendedQuantity: 15000,
        manufacturer: "Federal",
        value: 0.5,
      },
      {
        assetId: "AST-003",
        name: "Humvee",
        type: "vehicle",
        category: "Transport Vehicle",
        unit: "pieces",
        currentBase: "Base Alpha",
        totalQuantity: 25,
        availableQuantity: 8,
        assignedQuantity: 15,
        expendedQuantity: 2,
        manufacturer: "AM General",
        model: "M1151",
        value: 220000,
      },
    ])

    // Create sample purchases
    const purchases = await Purchase.create([
      {
        purchaseId: "PUR-001",
        assetType: "weapon",
        assetName: "M4 Carbine",
        quantity: 50,
        unit: "pieces",
        unitPrice: 1200,
        totalAmount: 60000,
        destinationBase: "Base Alpha",
        vendor: "Defense Contractor Inc",
        purchaseDate: new Date("2024-01-15"),
        status: "delivered",
        purchasedBy: users[2]._id,
      },
      {
        purchaseId: "PUR-002",
        assetType: "ammunition",
        assetName: "5.56mm Rounds",
        quantity: 10000,
        unit: "rounds",
        unitPrice: 0.5,
        totalAmount: 5000,
        destinationBase: "Base Alpha",
        vendor: "Ammo Supply Co",
        purchaseDate: new Date("2024-01-20"),
        status: "delivered",
        purchasedBy: users[2]._id,
      },
      {
        purchaseId: "PUR-003",
        assetType: "vehicle",
        assetName: "Humvee",
        quantity: 5,
        unit: "pieces",
        unitPrice: 220000,
        totalAmount: 1100000,
        destinationBase: "Base Alpha",
        vendor: "Military Vehicles Corp",
        purchaseDate: new Date("2024-02-01"),
        status: "pending",
        purchasedBy: users[2]._id,
      },
    ])

    // Create sample transfers
    const transfers = await Transfer.create([
      {
        transferId: "TRF-001",
        assetId: assets[0]._id,
        assetName: "M4 Carbine",
        assetType: "weapon",
        quantity: 10,
        unit: "pieces",
        fromBase: "Base Alpha",
        toBase: "Base Beta",
        transferDate: new Date("2024-01-25"),
        expectedDeliveryDate: new Date("2024-01-27"),
        status: "delivered",
        initiatedBy: users[1]._id,
        approvedBy: users[0]._id,
        reason: "Base Beta requires additional weapons for training",
        transportMethod: "ground",
        trackingNumber: "TRK-001",
      },
      {
        transferId: "TRF-002",
        assetId: assets[1]._id,
        assetName: "5.56mm Rounds",
        assetType: "ammunition",
        quantity: 5000,
        unit: "rounds",
        fromBase: "Base Beta",
        toBase: "Base Alpha",
        transferDate: new Date("2024-02-05"),
        status: "in_transit",
        initiatedBy: users[1]._id,
        reason: "Surplus ammunition transfer",
        transportMethod: "ground",
      },
    ])

    // Create sample assignments
    const assignments = await Assignment.create([
      {
        assetName: "M4 Carbine",
        assetType: "weapon",
        quantity: 15,
        personnelName: "Johnson",
        personnelRank: "Sergeant",
        personnelId: "SGT-001",
        base: "Base Alpha",
        assignedDate: new Date("2024-01-30"),
        expectedReturnDate: new Date("2024-02-15"),
        status: "active",
        assignedBy: users[1]._id,
        purpose: "Training Exercise Alpha",
        notes: "Standard training assignment",
      },
      {
        assetName: "5.56mm Rounds",
        assetType: "ammunition",
        quantity: 1000,
        personnelName: "Williams",
        personnelRank: "Corporal",
        personnelId: "CPL-002",
        base: "Base Alpha",
        assignedDate: new Date("2024-02-01"),
        status: "expended",
        assignedBy: users[1]._id,
        purpose: "Live Fire Exercise",
        expendedQuantity: 1000,
        expendedDate: new Date("2024-02-03"),
      },
    ])

    // Create sample balance records
    const balances = await Balance.create([
      {
        base: "Base Alpha",
        assetType: "weapon",
        assetName: "M4 Carbine",
        unit: "pieces",
        date: new Date("2024-01-01"),
        openingBalance: 100,
        purchases: 50,
        transferIn: 0,
        transferOut: 10,
        assigned: 30,
        expended: 0,
        closingBalance: 110,
        netMovement: 10,
      },
      {
        base: "Base Alpha",
        assetType: "ammunition",
        assetName: "5.56mm Rounds",
        unit: "rounds",
        date: new Date("2024-01-01"),
        openingBalance: 50000,
        purchases: 10000,
        transferIn: 5000,
        transferOut: 15000,
        assigned: 20000,
        expended: 5000,
        closingBalance: 25000,
        netMovement: 0,
      },
      {
        base: "Base Alpha",
        assetType: "vehicle",
        assetName: "Humvee",
        unit: "pieces",
        date: new Date("2024-01-01"),
        openingBalance: 20,
        purchases: 5,
        transferIn: 2,
        transferOut: 3,
        assigned: 15,
        expended: 1,
        closingBalance: 23,
        netMovement: 4,
      },
      {
        base: "Base Beta",
        assetType: "weapon",
        assetName: "M4 Carbine",
        unit: "pieces",
        date: new Date("2024-01-01"),
        openingBalance: 75,
        purchases: 0,
        transferIn: 10,
        transferOut: 5,
        assigned: 25,
        expended: 0,
        closingBalance: 80,
        netMovement: 5,
      },
    ])

    console.log("Sample data seeded successfully!")
    console.log(`Created ${users.length} users`)
    console.log(`Created ${assets.length} assets`)
    console.log(`Created ${purchases.length} purchases`)
    console.log(`Created ${transfers.length} transfers`)
    console.log(`Created ${assignments.length} assignments`)
    console.log(`Created ${balances.length} balance records`)

    console.log("\nLogin credentials:")
    console.log("Admin: admin / admin123")
    console.log("Base Commander: base1_commander / commander123")
    console.log("Logistics Officer: logistics1 / logistics123")

    process.exit(0)
  } catch (error) {
    console.error("Error seeding data:", error)
    process.exit(1)
  }
}

seedData()