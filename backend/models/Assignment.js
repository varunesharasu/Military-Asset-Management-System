// backend/models/Assignment.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  equipmentType: { type: String, required: true },
  quantity: { type: Number, required: true },
  base: { type: String, required: true },
  personnel: { type: String, required: true },
  type: { type: String, enum: ['Assigned', 'Expended'], required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);