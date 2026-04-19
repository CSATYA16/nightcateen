const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const adminAuth = require('../middleware/adminAuth');

const DEFAULT_MENU = [
  { name: 'Masala Chicken Maggi', description: 'Spicy double masala maggi with chunks of chicken', price: 60, category: 'Maggi', image: '🍜', stock: 20, isSpecial: true },
  { name: 'Cheese Maggi', description: 'Classic maggi loaded with extra cheese', price: 45, category: 'Maggi', image: '🧀', stock: 25 },
  { name: 'Butter Maggi', description: 'Rich butter-tossed maggi with herbs', price: 40, category: 'Maggi', image: '🍝', stock: 20 },
  { name: 'Cold Coffee', description: 'Thick and creamy cold coffee', price: 50, category: 'Beverages', image: '🧋', stock: 30 },
  { name: 'Oreo Shake', description: 'Crushed oreos blended with milk and ice cream', price: 70, category: 'Beverages', image: '🥤', stock: 15 },
  { name: 'Mango Lassi', description: 'Fresh mango blended with chilled yogurt', price: 55, category: 'Beverages', image: '🥭', stock: 20 },
  { name: 'Egg Roll', description: 'Crispy paratha filled with spiced egg', price: 40, category: 'Rolls', image: '🌯', stock: 30 },
  { name: 'Chicken Roll', description: 'Spicy chicken chunks wrapped in paratha', price: 60, category: 'Rolls', image: '🌯', stock: 25 },
  { name: 'Paneer Roll', description: 'Grilled paneer tikka wrapped in paratha', price: 55, category: 'Rolls', image: '🫔', stock: 20 },
  { name: 'Boiled Eggs (2)', description: 'Two perfectly boiled eggs with salt & pepper', price: 20, category: 'Snacks', image: '🥚', stock: 40 },
  { name: 'Bread Omelette', description: 'Fluffy omelette with buttered toast', price: 35, category: 'Snacks', image: '🍳', stock: 25 },
  { name: 'Veg Sandwich', description: 'Grilled veggie sandwich with cheese', price: 45, category: 'Snacks', image: '🥪', stock: 20 },
];

// ── GET today's menu ──────────────────────────────────────────────────────
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let items = await MenuItem.find({ date: today }).sort({ category: 1 });

    // Seed default menu if nothing exists for today
    if (items.length === 0) {
      const seeded = DEFAULT_MENU.map(item => ({ ...item, date: today }));
      items = await MenuItem.insertMany(seeded);
    }

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Get all menu items ─────────────────────────────────────────────
router.get('/', adminAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const items = await MenuItem.find({ date: today }).sort({ category: 1, name: 1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Add menu item ──────────────────────────────────────────────────
router.post('/', adminAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const item = await MenuItem.create({ ...req.body, date: today });
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Edit menu item ─────────────────────────────────────────────────
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Delete menu item ───────────────────────────────────────────────
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Toggle availability ────────────────────────────────────────────
router.patch('/:id/toggle', adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    item.available = !item.available;
    await item.save();
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Update stock ───────────────────────────────────────────────────
router.patch('/:id/stock', adminAuth, async (req, res) => {
  try {
    const { stock } = req.body;
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { stock: Math.max(0, stock), available: stock > 0 },
      { new: true }
    );
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Force reseed today's menu ─────────────────────────────────────
router.post('/seed', adminAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await MenuItem.deleteMany({ date: today });
    const seeded = DEFAULT_MENU.map(item => ({ ...item, date: today }));
    const items = await MenuItem.insertMany(seeded);
    res.json({ message: 'Menu reseeded', count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
