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

// Nodemailer Email Integration
const nodemailer = require('nodemailer');
const temporaryOtps = new Map();

function generateOTP() { return String(Math.floor(1000 + Math.random() * 9000)); }

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email address is required' });
  
  const otp = generateOTP();
  temporaryOtps.set(email, otp);
  setTimeout(() => temporaryOtps.delete(email), 5 * 60 * 1000); // 5 min expiry
  
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_gmail_address@gmail.com') {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: `"Night Canteen" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Login OTP',
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
      console.log(`📧 EMAIL DISPATCHED -> real message sent to ${email}`);
    } else {
      console.warn('⚠️ Nodemailer keys not configured in .env. Falling back to local console mock delivery.');
      console.log(`📧 EMAIL SIMULATION -> Sent OTP [${otp}] to ${email}`);
    }
    
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('❌ Nodemailer Error:', error.message);
    res.status(500).json({ error: 'Failed to send Email. Please verify the address.' });
  }
});

router.post('/verify-otp', (req, res) => {
  const { email, otp, isSignup, name, room } = req.body;
  const storedOtp = temporaryOtps.get(email);
  
  if (!storedOtp) return res.status(400).json({ error: 'OTP expired or not requested' });
  if (storedOtp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  
  temporaryOtps.delete(email);
  
  // Notice we now issue the JWT using email payload
  const token = jwt.sign({ role: 'customer', email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, role: 'customer', name: isSignup ? name : 'Demo Student', email, phone: email, room: isSignup ? room : 'A-101' });
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
