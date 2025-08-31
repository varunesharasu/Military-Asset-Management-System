// backend/controllers/assetController.js
const Asset = require('../models/Asset');
const Purchase = require('../models/Purchase');
const Transfer = require('../models/Transfer');
const Assignment = require('../models/Assignment');

const getDashboardMetrics = async (req, res) => {
  const { base, equipmentType, date } = req.query;

  let filter = {};
  if (base) filter.base = base;
  if (equipmentType) filter.equipmentType = equipmentType;

  const assets = await Asset.find(filter);
  const purchases = await Purchase.find(filter);
  const transfersIn = await Transfer.find({ ...filter, toBase: base });
  const transfersOut = await Transfer.find({ ...filter, fromBase: base });
  const assignments = await Assignment.find(filter);

  const totalOpening = assets.reduce((sum, a) => sum + a.openingBalance, 0);
  const totalClosing = assets.reduce((sum, a) => sum + a.closingBalance, 0);

  const totalPurchases = purchases.reduce((sum, p) => sum + p.quantity, 0);
  const totalTransfersIn = transfersIn.reduce((sum, t) => sum + t.quantity, 0);
  const totalTransfersOut = transfersOut.reduce((sum, t) => sum + t.quantity, 0);
  const netMovement = totalPurchases + totalTransfersIn - totalTransfersOut;

  const assigned = assignments
    .filter(a => a.type === 'Assigned')
    .reduce((sum, a) => sum + a.quantity, 0);

  const expended = assignments
    .filter(a => a.type === 'Expended')
    .reduce((sum, a) => sum + a.quantity, 0);

  res.json({
    openingBalance: totalOpening,
    closingBalance: totalClosing,
    netMovement,
    purchases: totalPurchases,
    transfersIn: totalTransfersIn,
    transfersOut: totalTransfersOut,
    assigned,
    expended
  });
};

module.exports = { getDashboardMetrics };