// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Base Commander', 'Logistics Officer'], 
    required: true 
  },
  base: { type: String } // Only for Base Commander and Logistics Officer
});

module.exports = mongoose.model('User', userSchema);