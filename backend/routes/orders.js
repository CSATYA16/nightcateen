const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Transaction = require('../models/Transaction');
const adminAuth = require('../middleware/adminAuth');
const nodemailer = require('nodemailer');

// ── Email helper ─────────────────────────────────────────────────────────────
const EMAIL_USER = process.env.EMAIL_USER || 'satyanarayanareddy.chukkaluru@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'npyiwguzgyawxtor';

async function sendOrderReadyEmail(email, studentName, orderId, otp) {
  if (!email) {
    console.log(`📧 No customer email on order — skipping ready notification.`);
    return;
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
  });
  await transporter.sendMail({
    from: `"Night Canteen" <${EMAIL_USER}>`,
    to: email,
    subject: `🍽️ Your Order ${orderId} is Ready for Pickup!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:460px;margin:0 auto;padding:24px;border:1px solid #eaeaea;border-radius:12px;text-align:center">
        <h2 style="color:#6a0dad">🌙 Night Canteen</h2>
        <h3 style="color:#333">Your order is ready for pickup! 🎉</h3>
        <p style="color:#555">Hi <strong>${studentName}</strong>, your order <strong>${orderId}</strong> is hot and ready at the counter!</p>
        <div style="background:#f4f4f4;padding:16px;font-size:28px;font-weight:bold;letter-spacing:8px;margin:20px 0;border-radius:8px">${otp}</div>
        <p style="color:#777;font-size:13px">Show this OTP at the counter to collect your order.</p>
      </div>
    `
  });
  console.log(`📧 ORDER READY EMAIL DISPATCHED -> ${email}`);
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function generateOTP() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function generateOrderId() {
  const count = Date.now() % 10000;
  return `ORD-${String(count).padStart(3, '0')}`;
}

async function calcEstimatedMins() {
  const pendingCooking = await Order.countDocuments({ status: { $in: ['pending', 'cooking'] } });
  const avgPrepTime = 5; // minutes per order slot
  return Math.max(10, pendingCooking * avgPrepTime);
}

// ── Customer: Get active order by roll number ─────────────────────────────
// GET /api/orders/active?rollNumber=xxx
router.get('/active', async (req, res) => {
  try {
    const { rollNumber } = req.query;
    if (!rollNumber) return res.json({ order: null });
    const order = await Order.findOne({
      rollNumber,
      status: { $in: ['pending', 'cooking', 'ready'] }
    }).sort({ createdAt: -1 });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Customer: Place an order ─────────────────────────────────────────────
// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { studentName, rollNumber, items, customerEmail } = req.body;
    if (!studentName || !rollNumber || !items || items.length === 0) {
      return res.status(400).json({ error: 'Name, roll number, and items are required.' });
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const otp = generateOTP();
    const orderId = generateOrderId();
    const estimatedMins = await calcEstimatedMins();
    const otpExpiresAt = new Date(Date.now() + 45 * 60 * 1000); // 45 min

    const order = await Order.create({
      orderId,
      studentName,
      rollNumber,
      customerEmail: customerEmail || '',
      items,
      otp,
      total,
      estimatedMins,
      otpExpiresAt,
    });

    // Record transaction
    await Transaction.create({
      orderId,
      amount: total,
      items: items.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
    });

    // Decrement stock
    for (const item of items) {
      if (item.menuItemId) {
        await MenuItem.findByIdAndUpdate(item.menuItemId, {
          $inc: { stock: -item.quantity }
        });
        await MenuItem.updateMany(
          { _id: item.menuItemId, stock: { $lte: 0 } },
          { $set: { available: false, stock: 0 } }
        );
      }
    }

    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Get all orders ─────────────────────────────────────────────────
// GET /api/orders?status=pending&limit=50
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Update order status ─────────────────────────────────────────────
// PATCH /api/orders/:id/status
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Send email notification to customer when order is marked ready
    if (status === 'ready' && order.customerEmail) {
      try {
        await sendOrderReadyEmail(order.customerEmail, order.studentName, order.orderId, order.otp);
      } catch (mailErr) {
        console.error('⚠️ Failed to send ready email:', mailErr.message);
      }
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Verify OTP and deliver ─────────────────────────────────────────
// POST /api/orders/:id/verify-otp
router.post('/:id/verify-otp', adminAuth, async (req, res) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.pickedUp) return res.status(400).json({ error: 'Order already picked up.' });
    if (order.otp !== otp) return res.status(400).json({ error: 'Invalid OTP.' });
    if (order.otpExpiresAt && new Date() > order.otpExpiresAt) {
      return res.status(400).json({ error: 'OTP expired.' });
    }
    order.pickedUp = true;
    order.otpVerified = true;
    order.status = 'delivered';
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Cancel order ───────────────────────────────────────────────────
// DELETE /api/orders/:id
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
