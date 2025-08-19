// backend/middleware/logger.js
const Log = require('../models/Log');

const logRequest = async (req, res, next) => {
  const start = Date.now();
  next();
  const duration = Date.now() - start;

  // Log only write operations
  if (req.method !== 'GET') {
    const action = `${req.method} ${req.originalUrl}`;
    const user = req.user ? req.user.username : 'Unknown';
    const role = req.user ? req.user.role : 'None';

    await Log.create({
      action,
      user,
      role,
      details: `IP: ${req.ip}, Duration: ${duration}ms`
    });
  }
};

module.exports = { logRequest };