const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../logs/api.log');

function logTransaction(req, res, next) {
    const user = req.user ? req.user.username : 'Unknown';
    const logEntry = {
        timestamp: new Date().toISOString(),
        user,
        method: req.method,
        endpoint: req.originalUrl,
        body: req.body,
        query: req.query
    };
    fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n', err => {
        if (err) {
            console.error('Failed to write log:', err);
        }
    });
    next();
}

module.exports = logTransaction;
