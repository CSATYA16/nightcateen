const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:      { type: String, required: true, trim: true },
  phone:     { type: String, default: '' },
  room:      { type: String, default: '' },
  totalOrders: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
