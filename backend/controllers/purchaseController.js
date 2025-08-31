// backend/controllers/purchaseController.js
const Purchase = require('../models/Purchase');

const createPurchase = async (req, res) => {
  const { equipmentType, quantity, base } = req.body;
  const purchase = await Purchase.create({ equipmentType, quantity, base });
  res.status(201).json(purchase);
};

const getPurchases = async (req, res) => {
  const { base, equipmentType, startDate, endDate } = req.query;
  let filter = {};
  if (base) filter.base = base;
  if (equipmentType) filter.equipmentType = equipmentType;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  const purchases = await Purchase.find(filter).sort({ date: -1 });
  res.json(purchases);
};

module.exports = { createPurchase, getPurchases };