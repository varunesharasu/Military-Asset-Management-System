const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const dashboardRoutes = require("./routes/dashboard")
const purchaseRoutes = require("./routes/purchases")
const transferRoutes = require("./routes/transfers")
const assignmentRoutes = require("./routes/assignments")
const baseRoutes = require("./routes/bases")
const equipmentRoutes = require("./routes/equipment")
const logRoutes = require("./routes/logs")

const { errorHandler } = require("./middleware/errorHandler")
const { requestLogger } = require("./middleware/logger")

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use(requestLogger)

// Database connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/military-assets", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Routes
// Comment out all route usages for debugging
// app.use("/api/auth", authRoutes)
// app.use("/api/dashboard", dashboardRoutes)
// app.use("/api/purchases", purchaseRoutes)
// app.use("/api/transfers", transferRoutes)
// app.use("/api/assignments", assignmentRoutes)
// app.use("/api/bases", baseRoutes)
// app.use("/api/equipment", equipmentRoutes)
// app.use("/api/logs", logRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
