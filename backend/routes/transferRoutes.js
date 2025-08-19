// backend/routes/transferRoutes.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createTransfer, getTransfers } = require('../controllers/transferController');
const router = express.Router();

router.post('/', protect, authorize('Admin', 'Logistics Officer'), createTransfer);
router.get('/', protect, getTransfers);

module.exports = router;