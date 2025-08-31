// backend/routes/assetRoutes.js
const express = require('express');
const { protect } = require('../middleware/auth');
const { getDashboardMetrics } = require('../controllers/assetController');
const router = express.Router();

router.get('/dashboard', protect, getDashboardMetrics);
module.exports = router;