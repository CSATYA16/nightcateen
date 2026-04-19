const express = require('express');
const router = express.Router();
const Deal = require('../models/Deal');
const adminAuth = require('../middleware/adminAuth');

// ── GET active deals (public) ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const deals = await Deal.find({}).sort({ active: -1, createdAt: -1 });
    if (deals.length === 0) {
      // Seed some default deals if empty
      const defaultDeals = [
        { title: 'Midnight Combo', description: '2x Any Maggi + 2x Cold Coffee at a discounted price.', originalPrice: 220, dealPrice: 199, validFrom: '12:00 AM', validTo: '3:00 AM', active: true, items: ['Maggi', 'Cold Coffee'] },
        { title: 'Early Bird Discount', description: '10% off on all beverages.', originalPrice: 100, dealPrice: 90, discountPercent: 10, validFrom: '10:00 PM', validTo: '12:00 AM', active: false, items: ['Beverages'] },
      ];
      const created = await Deal.insertMany(defaultDeals);
      return res.json({ deals: created });
    }
    res.json({ deals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Create deal ────────────────────────────────────────────────────
router.post('/', adminAuth, async (req, res) => {
  try {
    const deal = await Deal.create(req.body);
    res.status(201).json({ deal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Update deal ────────────────────────────────────────────────────
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ deal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Toggle deal active state ──────────────────────────────────────
router.patch('/:id/toggle', adminAuth, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });
    deal.active = !deal.active;
    await deal.save();
    res.json({ deal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Delete deal ────────────────────────────────────────────────────
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Deal.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
