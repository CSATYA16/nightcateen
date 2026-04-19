const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const MenuItem = require('../models/MenuItem');
const adminAuth = require('../middleware/adminAuth');

// ─── Lightweight Rule-Based AI Insights ───────────────────────────────────
function generateAIInsights(orders, menuItems) {
  const insights = [];

  // Count item frequencies
  const itemCounts = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    });
  });
  const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);

  if (sorted.length > 0) {
    const topItem = sorted[0][0];
    insights.push({ type: 'trending', icon: '🔥', title: 'Top Seller Alert', message: `"${topItem}" is flying off the shelf! Consider making a combo with it.` });
  }

  // Peak hour detection
  const hourCounts = {};
  orders.forEach(order => {
    const h = new Date(order.createdAt).getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  if (peakHour) {
    const h = parseInt(peakHour[0]);
    const label = h >= 12 ? `${h > 12 ? h - 12 : h}:00 PM` : `${h}:00 AM`;
    insights.push({ type: 'peak', icon: '⏰', title: 'Peak Hour', message: `Most orders come in at ${label}. Prep your kitchen ~30 min before.` });
  }

  // Low stock warning
  const lowStock = menuItems.filter(m => m.stock > 0 && m.stock <= 5);
  if (lowStock.length > 0) {
    insights.push({ type: 'stock', icon: '⚠️', title: 'Low Stock Alert', message: `${lowStock.map(m => m.name).join(', ')} ${lowStock.length === 1 ? 'is' : 'are'} running low. Restock soon!` });
  }

  // Revenue suggestion
  if (orders.length >= 20) {
    insights.push({ type: 'revenue', icon: '💡', title: 'Bundle Suggestion', message: `You've had ${orders.length} orders today. A "Midnight Bundle" deal could increase average order value by 20%.` });
  } else if (orders.length < 5) {
    insights.push({ type: 'slow', icon: '📉', title: 'Slow Night', message: `Only ${orders.length} orders so far. Consider enabling a flash deal to drive more traffic.` });
  }

  return insights;
}

// ── Daily Analytics ───────────────────────────────────────────────────────
router.get('/daily', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({ createdAt: { $gte: today, $lt: tomorrow } });
    const transactions = await Transaction.find({ timestamp: { $gte: today, $lt: tomorrow } });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalOrders = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const cooking = orders.filter(o => o.status === 'cooking').length;
    const ready = orders.filter(o => o.status === 'ready').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;

    // Most ordered item
    const itemCounts = {};
    orders.forEach(o => o.items.forEach(i => {
      itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
    }));
    const mostOrdered = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

    res.json({
      totalRevenue,
      totalOrders,
      statusBreakdown: { pending, cooking, ready, delivered },
      mostOrdered: mostOrdered ? { name: mostOrdered[0], count: mostOrdered[1] } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Time-wise Sales Breakdown ─────────────────────────────────────────────
router.get('/timewise', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const transactions = await Transaction.find({ timestamp: { $gte: today, $lt: tomorrow } });

    const hourly = {};
    for (let h = 18; h <= 26; h++) { // 6 PM to 2 AM next day
      const label = h < 24 ? `${h > 12 ? h - 12 : h}PM` : `${h - 24}AM`;
      hourly[h] = { hour: label, revenue: 0, orders: 0 };
    }

    transactions.forEach(t => {
      const h = new Date(t.timestamp).getHours();
      const key = h < 6 ? h + 24 : h;
      if (hourly[key]) {
        hourly[key].revenue += t.amount;
        hourly[key].orders += 1;
      }
    });

    res.json({ timewise: Object.values(hourly) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Weekly Chart Data ─────────────────────────────────────────────────────
router.get('/weekly', adminAuth, async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const txns = await Transaction.find({ timestamp: { $gte: d, $lt: next } });
      const revenue = txns.reduce((s, t) => s + t.amount, 0);
      const orders = txns.length;
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({ name: dayLabel, revenue, orders });
    }
    res.json({ weekly: days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── AI Insights ───────────────────────────────────────────────────────────
router.get('/ai-insights', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [orders, menuItems] = await Promise.all([
      Order.find({ createdAt: { $gte: today, $lt: tomorrow } }),
      MenuItem.find({ date: today.toISOString().split('T')[0] }),
    ]);

    const insights = generateAIInsights(orders, menuItems);
    res.json({ insights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
