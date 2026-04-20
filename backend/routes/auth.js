const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// Nodemailer Email Integration
const nodemailer = require('nodemailer');
const EMAIL_USER = process.env.EMAIL_USER || 'satyanarayanareddy.chukkaluru@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'npyiwguzgyawxtor';
const temporaryOtps = new Map();

function generateOTP() { return String(Math.floor(1000 + Math.random() * 9000)); }

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email address is required' });
  
  const otp = generateOTP();
  temporaryOtps.set(email, otp);
  setTimeout(() => temporaryOtps.delete(email), 5 * 60 * 1000); // 5 min expiry
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });

    const mailOptions = {
      from: `"Night Canteen" <${EMAIL_USER}>`,
      to: email,
      subject: 'Your Night Canteen Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; text-align: center;">
          <h2 style="color: #6a0dad;">🌙 Night Canteen</h2>
          <p style="color: #555;">Hello! Here is your secure one-time password to access the app.</p>
          <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
            ${otp}
          </div>
          <p style="color: #999; font-size: 12px;">This code will expire in 5 minutes. Please do not share it.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP EMAIL DISPATCHED -> ${email}`);
    
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('❌ Nodemailer Error:', error.message);
    res.status(500).json({ error: 'Failed to send Email. Please verify the address.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp, isSignup, name, phone, room } = req.body;
  const storedOtp = temporaryOtps.get(email);
  
  if (!storedOtp) return res.status(400).json({ error: 'OTP expired or not requested' });
  if (storedOtp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  
  temporaryOtps.delete(email);
  
  // Upsert user profile in MongoDB
  let userDoc;
  try {
    userDoc = await User.findOneAndUpdate(
      { email },
      { 
        $set: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(room && { room }),
        },
        $setOnInsert: { name: name || email.split('@')[0], email }
      },
      { new: true, upsert: true }
    );
  } catch (e) {
    console.error('User upsert error:', e.message);
  }

  const token = jwt.sign({ role: 'customer', email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({
    token,
    role: 'customer',
    name: userDoc?.name || name || email.split('@')[0],
    email,
    phone: userDoc?.phone || phone || '',
    room: userDoc?.room || room || '',
  });
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
