const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nightcanteen_secret';

// Middleware: verify customer JWT and attach email to req
function customerAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    req.userEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// GET /api/users/profile  — fetch logged-in user's profile
router.get('/profile', customerAuth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.userEmail });
    if (!user) return res.status(404).json({ error: 'Profile not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/profile  — create or update profile (upsert)
router.post('/profile', customerAuth, async (req, res) => {
  try {
    const { name, phone, room } = req.body;
    const user = await User.findOneAndUpdate(
      { email: req.userEmail },
      { name, phone, room },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
