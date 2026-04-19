const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'nightcanteen_secret';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, role: 'admin', name: 'Admin' });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// POST /api/auth/verify
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.json({ valid: false });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, role: decoded.role });
  } catch {
    res.json({ valid: false });
  }
});

module.exports = router;
