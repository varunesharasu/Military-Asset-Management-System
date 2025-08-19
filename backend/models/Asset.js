// backend/models/Asset.js
const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  equipmentType: { type: String, required: true },
  base: { type: String, required: true },
  openingBalance: { type: Number, default: 0 },
  closingBalance: { type: Number, default: 0 },
  assigned: { type: Number, default: 0 },
  expended: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Asset', assetSchema);