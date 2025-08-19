// backend/routes/purchaseRoutes.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createPurchase, getPurchases } = require('../controllers/purchaseController');
const router = express.Router();

router.post('/', protect, authorize('Admin', 'Logistics Officer'), createPurchase);
router.get('/', protect, getPurchases);

module.exports = router;