// backend/routes/assignmentRoutes.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createAssignment, getAssignments } = require('../controllers/assignmentController');
const router = express.Router();

router.post('/', protect, authorize('Admin', 'Base Commander'), createAssignment);
router.get('/', protect, getAssignments);

module.exports = router;