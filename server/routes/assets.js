const express = require("express")
const { auth, authorize, checkBaseAccess } = require("../middleware/auth")

const router = express.Router()

// Placeholder routes for assets
router.get("/", auth, (req, res) => {
  res.json({ message: "Assets endpoint - Coming soon" })
})

module.exports = router
