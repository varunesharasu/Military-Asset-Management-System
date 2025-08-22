// Sample data seeding script for testing dashboard functionality
const mongoose = require("mongoose")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config({ path: "../server/.env" })

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    await mongoose.connection.asPromise() // Ensure connection is ready
    console.log("Connected to MongoDB")

  // Import models directly (except User, which exports a schema)
  const userSchema = require("../server/models/User")
  const User = mongoose.model("User", userSchema)
  const Asset = require("../server/models/Asset")
  const Purchase = require("../server/models/Purchase")
  const Transfer = require("../server/models/Transfer")
  const Assignment = require("../server/models/Assignment")
  const Balance = require("../server/models/Balance")

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
        assignedBase: "Fort Alpha",
        firstName: "Sarah",
        lastName: "Johnson",
        rank: "Major",
      },
      {
        username: "logistics1",
        email: "logistics1@military.gov",
        password: "logistics123",
        role: "logistics_officer",
        assignedBase: "Fort Alpha",
        firstName: "Mike",
        lastName: "Davis",
        rank: "Captain",
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
        destinationBase: "Fort Alpha",
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
        destinationBase: "Fort Alpha",
        vendor: "Ammo Supply Co",
        purchaseDate: new Date("2024-01-20"),
        status: "delivered",
        purchasedBy: users[2]._id,
      },
    ])

    // Create sample balance records
    const balances = await Balance.create([
      {
        base: "Fort Alpha",
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
        netMovement: 40,
      },
      {
        base: "Fort Alpha",
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
        base: "Fort Alpha",
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
    ])

    console.log("Sample data seeded successfully!")
    console.log(`Created ${users.length} users`)
    console.log(`Created ${purchases.length} purchases`)
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
