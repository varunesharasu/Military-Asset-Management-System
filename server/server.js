const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/assets", require("./routes/assets"))
app.use("/api/purchases", require("./routes/purchases"))
app.use("/api/transfers", require("./routes/transfers"))
app.use("/api/assignments", require("./routes/assignments"))
app.use("/api/dashboard", require("./routes/dashboard"))

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Military Asset Management System API" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
