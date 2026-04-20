const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  image: { type: String, default: '🍽️' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  items: [orderItemSchema],
  otp: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'cooking', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  total: { type: Number, required: true },
  packingCharges: { type: Number, default: 0 },
  estimatedMins: { type: Number, default: 15 },
  pickedUp: { type: Boolean, default: false },
  otpVerified: { type: Boolean, default: false },
  otpExpiresAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
