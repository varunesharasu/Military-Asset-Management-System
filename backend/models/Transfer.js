// backend/models/Transfer.js
const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  equipmentType: { type: String, required: true },
  quantity: { type: Number, required: true },
  fromBase: { type: String },
  toBase: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' } // Can be 'Completed', 'Pending'
});

module.exports = mongoose.model('Transfer', transferSchema);