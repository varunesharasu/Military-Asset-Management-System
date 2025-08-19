// backend/models/Log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: String, required: true },
  role: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String }
});

module.exports = mongoose.model('Log', logSchema);