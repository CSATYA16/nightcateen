const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  originalPrice: { type: Number, required: true },
  dealPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  validFrom: { type: String, default: '10:00 PM' },
  validTo: { type: String, default: '3:00 AM' },
  active: { type: Boolean, default: true },
  items: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Deal', dealSchema);
