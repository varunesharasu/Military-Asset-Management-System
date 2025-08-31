// backend/controllers/transferController.js
const Transfer = require('../models/Transfer');

const createTransfer = async (req, res) => {
  const { equipmentType, quantity, fromBase, toBase } = req.body;
  const transfer = await Transfer.create({ equipmentType, quantity, fromBase, toBase });
  res.status(201).json(transfer);
};

const getTransfers = async (req, res) => {
  const { base, equipmentType } = req.query;
  let filter = {};
  if (base) filter.$or = [{ fromBase: base }, { toBase: base }];
  if (equipmentType) filter.equipmentType = equipmentType;
  const transfers = await Transfer.find(filter).sort({ date: -1 });
  res.json(transfers);
};

module.exports = { createTransfer, getTransfers };