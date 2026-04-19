const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  category: { type: String, default: 'Other' },
  image: { type: String, default: '🍽️' },
  available: { type: Boolean, default: true },
  stock: { type: Number, default: 50 },
  isSpecial: { type: Boolean, default: false },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
