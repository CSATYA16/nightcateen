require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/analytics', require('./routes/analytics'));

app.get('/', (req, res) => {
  res.json({ message: '🌙 Night Canteen API is running', status: 'ok', timestamp: new Date() });
});

// ── Error Handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── DB + Start ─────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/night-canteen';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected:', MONGO_URI);
    app.listen(PORT, () => {
      console.log(`🌙 Night Canteen server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.warn('⚠️  MongoDB not available:', err.message);
    console.log('📦 Starting in DEMO mode (in-memory fallback)...');
    startDemoMode();
  });

// ── Demo Mode Fallback (no MongoDB) ───────────────────────────────────────
function startDemoMode() {
  // Override mongoose models with in-memory storage
  const inMemoryOrders = [];
  const inMemoryMenu = generateDefaultMenu();
  const inMemoryDeals = generateDefaultDeals();
  const inMemoryTransactions = [];
  let orderCounter = 100;

  function generateDefaultMenu() {
    const today = new Date().toISOString().split('T')[0];
    return [
      { _id: '1', name: 'Masala Chicken Maggi', description: 'Spicy maggi with chicken', price: 60, category: 'Maggi', image: '🍜', stock: 20, available: true, isSpecial: true, date: today },
      { _id: '2', name: 'Cheese Maggi', description: 'Classic maggi with extra cheese', price: 45, category: 'Maggi', image: '🧀', stock: 25, available: true, date: today },
      { _id: '3', name: 'Butter Maggi', description: 'Butter-tossed maggi with herbs', price: 40, category: 'Maggi', image: '🍝', stock: 20, available: true, date: today },
      { _id: '4', name: 'Cold Coffee', description: 'Thick creamy cold coffee', price: 50, category: 'Beverages', image: '🧋', stock: 30, available: true, date: today },
      { _id: '5', name: 'Oreo Shake', description: 'Oreo blended with milk and ice cream', price: 70, category: 'Beverages', image: '🥤', stock: 15, available: true, date: today },
      { _id: '6', name: 'Mango Lassi', description: 'Fresh mango blended with yogurt', price: 55, category: 'Beverages', image: '🥭', stock: 20, available: true, date: today },
      { _id: '7', name: 'Egg Roll', description: 'Crispy paratha with spiced egg', price: 40, category: 'Rolls', image: '🌯', stock: 30, available: true, date: today },
      { _id: '8', name: 'Chicken Roll', description: 'Spicy chicken wrapped in paratha', price: 60, category: 'Rolls', image: '🌯', stock: 25, available: true, date: today },
      { _id: '9', name: 'Paneer Roll', description: 'Grilled paneer tikka in paratha', price: 55, category: 'Rolls', image: '🫔', stock: 20, available: true, date: today },
      { _id: '10', name: 'Boiled Eggs (2)', description: 'Two boiled eggs with salt & pepper', price: 20, category: 'Snacks', image: '🥚', stock: 40, available: true, date: today },
      { _id: '11', name: 'Bread Omelette', description: 'Fluffy omelette with buttered toast', price: 35, category: 'Snacks', image: '🍳', stock: 25, available: true, date: today },
      { _id: '12', name: 'Veg Sandwich', description: 'Grilled veggie sandwich with cheese', price: 45, category: 'Snacks', image: '🥪', stock: 20, available: true, date: today },
    ];
  }

  function generateDefaultDeals() {
    return [
      { _id: 'd1', title: 'Midnight Combo', description: '2x Any Maggi + 2x Cold Coffee', originalPrice: 220, dealPrice: 199, validFrom: '12:00 AM', validTo: '3:00 AM', active: true, items: ['Maggi', 'Cold Coffee'] },
      { _id: 'd2', title: 'Early Bird Discount', description: '10% off on all beverages', originalPrice: 100, dealPrice: 90, discountPercent: 10, validFrom: '10:00 PM', validTo: '12:00 AM', active: false, items: ['Beverages'] },
    ];
  }

  function generateOTP() { return String(Math.floor(1000 + Math.random() * 9000)); }

  // Override routes for demo mode
  const demoRouter = express.Router();

  // Auth
  demoRouter.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign({ role: 'admin' }, 'nightcanteen_secret', { expiresIn: '24h' });
      return res.json({ token, role: 'admin', name: 'Admin' });
    }
    res.status(401).json({ error: 'Invalid credentials' });
  });

  demoRouter.get('/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.json({ valid: false });
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], 'nightcanteen_secret');
      res.json({ valid: true, role: decoded.role });
    } catch { res.json({ valid: false }); }
  });

  // Menu
  demoRouter.get('/menu/today', (req, res) => res.json({ items: inMemoryMenu }));
  demoRouter.get('/menu', (req, res) => res.json({ items: inMemoryMenu }));
  demoRouter.post('/menu', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const item = { _id: String(Date.now()), ...req.body, date: today, available: true };
    inMemoryMenu.push(item);
    res.status(201).json({ item });
  });
  demoRouter.put('/menu/:id', (req, res) => {
    const idx = inMemoryMenu.findIndex(m => m._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    inMemoryMenu[idx] = { ...inMemoryMenu[idx], ...req.body };
    res.json({ item: inMemoryMenu[idx] });
  });
  demoRouter.delete('/menu/:id', (req, res) => {
    const idx = inMemoryMenu.findIndex(m => m._id === req.params.id);
    if (idx !== -1) inMemoryMenu.splice(idx, 1);
    res.json({ success: true });
  });
  demoRouter.patch('/menu/:id/toggle', (req, res) => {
    const item = inMemoryMenu.find(m => m._id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    item.available = !item.available;
    res.json({ item });
  });
  demoRouter.patch('/menu/:id/stock', (req, res) => {
    const item = inMemoryMenu.find(m => m._id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    item.stock = Math.max(0, req.body.stock);
    item.available = item.stock > 0;
    res.json({ item });
  });
  demoRouter.post('/menu/seed', (req, res) => {
    inMemoryMenu.length = 0;
    generateDefaultMenu().forEach(m => inMemoryMenu.push(m));
    res.json({ message: 'Reseeded', count: inMemoryMenu.length });
  });

  // Orders
  demoRouter.get('/orders/active', (req, res) => {
    const { rollNumber } = req.query;
    const order = inMemoryOrders.filter(o => o.rollNumber === rollNumber && ['pending', 'cooking', 'ready'].includes(o.status)).pop();
    res.json({ order: order || null });
  });
  demoRouter.post('/orders', (req, res) => {
    const { studentName, rollNumber, items } = req.body;
    if (!studentName || !rollNumber || !items?.length) return res.status(400).json({ error: 'Missing fields' });
    orderCounter++;
    const pendingCooking = inMemoryOrders.filter(o => ['pending', 'cooking'].includes(o.status)).length;
    const order = {
      _id: String(Date.now()),
      orderId: `ORD-${orderCounter}`,
      studentName, rollNumber, items,
      otp: generateOTP(),
      status: 'pending',
      total: items.reduce((s, i) => s + i.price * i.quantity, 0),
      estimatedMins: Math.max(10, pendingCooking * 5),
      pickedUp: false,
      createdAt: new Date().toISOString(),
    };
    inMemoryOrders.push(order);
    inMemoryTransactions.push({ orderId: order.orderId, amount: order.total, timestamp: new Date() });
    // decrement demo stock
    items.forEach(item => {
      const menuItem = inMemoryMenu.find(m => m._id === item.menuItemId || m.name === item.name);
      if (menuItem) {
        menuItem.stock = Math.max(0, menuItem.stock - item.quantity);
        if (menuItem.stock === 0) menuItem.available = false;
      }
    });
    res.status(201).json({ order });
  });
  demoRouter.get('/orders', (req, res) => {
    const { status } = req.query;
    let orders = [...inMemoryOrders].reverse();
    if (status && status !== 'all') orders = orders.filter(o => o.status === status);
    res.json({ orders });
  });
  demoRouter.patch('/orders/:id/status', (req, res) => {
    const order = inMemoryOrders.find(o => o._id === req.params.id || o.orderId === req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });
    order.status = req.body.status;
    res.json({ order });
  });
  demoRouter.post('/orders/:id/verify-otp', (req, res) => {
    const order = inMemoryOrders.find(o => o._id === req.params.id || o.orderId === req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.pickedUp) return res.status(400).json({ error: 'Already picked up' });
    if (order.otp !== req.body.otp) return res.status(400).json({ error: 'Invalid OTP' });
    order.pickedUp = true;
    order.status = 'delivered';
    res.json({ success: true, order });
  });
  demoRouter.delete('/orders/:id', (req, res) => {
    const order = inMemoryOrders.find(o => o._id === req.params.id || o.orderId === req.params.id);
    if (order) order.status = 'cancelled';
    res.json({ success: true });
  });

  // Deals
  demoRouter.get('/deals', (req, res) => res.json({ deals: inMemoryDeals }));
  demoRouter.post('/deals', (req, res) => {
    const deal = { _id: String(Date.now()), ...req.body, active: true };
    inMemoryDeals.push(deal);
    res.status(201).json({ deal });
  });
  demoRouter.put('/deals/:id', (req, res) => {
    const idx = inMemoryDeals.findIndex(d => d._id === req.params.id);
    if (idx !== -1) inMemoryDeals[idx] = { ...inMemoryDeals[idx], ...req.body };
    res.json({ deal: inMemoryDeals[idx] });
  });
  demoRouter.patch('/deals/:id/toggle', (req, res) => {
    const deal = inMemoryDeals.find(d => d._id === req.params.id);
    if (!deal) return res.status(404).json({ error: 'Not found' });
    deal.active = !deal.active;
    res.json({ deal });
  });
  demoRouter.delete('/deals/:id', (req, res) => {
    const idx = inMemoryDeals.findIndex(d => d._id === req.params.id);
    if (idx !== -1) inMemoryDeals.splice(idx, 1);
    res.json({ success: true });
  });

  // Analytics
  demoRouter.get('/analytics/daily', (req, res) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todaysOrders = inMemoryOrders.filter(o => new Date(o.createdAt) >= today);
    const totalRevenue = inMemoryTransactions.filter(t => new Date(t.timestamp) >= today).reduce((s, t) => s + t.amount, 0);
    const itemCounts = {};
    todaysOrders.forEach(o => o.items.forEach(i => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity; }));
    const mostOrdered = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];
    res.json({
      totalRevenue, totalOrders: todaysOrders.length,
      statusBreakdown: {
        pending: todaysOrders.filter(o => o.status === 'pending').length,
        cooking: todaysOrders.filter(o => o.status === 'cooking').length,
        ready: todaysOrders.filter(o => o.status === 'ready').length,
        delivered: todaysOrders.filter(o => o.status === 'delivered').length,
      },
      mostOrdered: mostOrdered ? { name: mostOrdered[0], count: mostOrdered[1] } : null,
    });
  });

  demoRouter.get('/analytics/timewise', (req, res) => {
    const slots = [
      { hour: '6PM', revenue: 0, orders: 0 }, { hour: '7PM', revenue: 0, orders: 0 },
      { hour: '8PM', revenue: 0, orders: 0 }, { hour: '9PM', revenue: 0, orders: 0 },
      { hour: '10PM', revenue: 0, orders: 0 }, { hour: '11PM', revenue: 0, orders: 0 },
      { hour: '12AM', revenue: 0, orders: 0 }, { hour: '1AM', revenue: 0, orders: 0 },
      { hour: '2AM', revenue: 0, orders: 0 },
    ];
    res.json({ timewise: slots });
  });

  demoRouter.get('/analytics/weekly', (req, res) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekly = days.map(name => ({
      name,
      revenue: Math.floor(Math.random() * 3000) + 1000,
      orders: Math.floor(Math.random() * 30) + 5,
    }));
    res.json({ weekly });
  });

  demoRouter.get('/analytics/ai-insights', (req, res) => {
    const insights = [
      { type: 'trending', icon: '🔥', title: 'Top Seller Alert', message: '"Masala Chicken Maggi" is the most popular item! Consider making a combo deal.' },
      { type: 'peak', icon: '⏰', title: 'Peak Hour Detected', message: 'Most orders come in at 12AM. Prep your kitchen 30 min before midnight.' },
      { type: 'slow', icon: '📉', title: 'Slow Night Mode', message: 'Enable a flash deal to attract more students during slow hours.' },
      { type: 'revenue', icon: '💡', title: 'Bundle Opportunity', message: 'A "Midnight Bundle" could increase average order value by 20%.' },
    ];
    res.json({ insights });
  });

  // Mount demo router
  app.use('/api', demoRouter);

  app.listen(PORT, () => {
    console.log(`🌙 Night Canteen server running on http://localhost:${PORT} (DEMO MODE)`);
  });
}
