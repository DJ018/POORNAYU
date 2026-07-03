// =============================================
// POORNAYU Investment Hub — Backend Server
// Node.js + Express API
// =============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' }));

// Serve static files (HTML, CSS, images, JS)
app.use(express.static(path.join(__dirname)));

// ---- Rate Limiter (protect API) ----
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// ---- Email Transporter ----
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'poornayuhub@gmail.com',
    pass: process.env.EMAIL_PASS || ''
  }
});

// =============================================
// API ROUTES
// =============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'POORNAYU API is running', timestamp: new Date().toISOString() });
});

// Contact Form Submission
app.post('/api/contact', apiLimiter, async (req, res) => {
  const { name, phone, email, service, message } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone number are required.' });
  }

  try {
    // Email to POORNAYU
    const internalMail = {
      from: `"POORNAYU Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER || 'poornayuhub@gmail.com',
      subject: `📩 New Consultation Request — ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f9ff;border-radius:10px;overflow:hidden;">
          <div style="background:#002244;padding:30px;text-align:center;">
            <h1 style="color:#c9a227;margin:0;font-size:28px;">POORNAYU</h1>
            <p style="color:#a0aec0;margin:8px 0 0;font-size:14px;">New Consultation Request</p>
          </div>
          <div style="padding:30px;background:#fff;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;font-weight:bold;color:#002244;width:140px;">Name:</td><td style="padding:10px 0;">${name}</td></tr>
              <tr><td style="padding:10px 0;font-weight:bold;color:#002244;">Phone:</td><td style="padding:10px 0;"><a href="tel:${phone}">${phone}</a></td></tr>
              <tr><td style="padding:10px 0;font-weight:bold;color:#002244;">Email:</td><td style="padding:10px 0;">${email || 'Not provided'}</td></tr>
              <tr><td style="padding:10px 0;font-weight:bold;color:#002244;">Service:</td><td style="padding:10px 0;">${service || 'General Consultation'}</td></tr>
              <tr><td style="padding:10px 0;font-weight:bold;color:#002244;vertical-align:top;">Message:</td><td style="padding:10px 0;">${message || 'No message provided'}</td></tr>
            </table>
          </div>
          <div style="background:#002244;padding:16px;text-align:center;">
            <p style="color:#a0aec0;font-size:12px;margin:0;">POORNAYU Investment Hub | Sanganer, Jaipur</p>
          </div>
        </div>
      `
    };

    // Acknowledgment email to client
    const clientMail = email ? {
      from: `"POORNAYU Investment Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✅ We Received Your Consultation Request — POORNAYU',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#002244;padding:30px;text-align:center;">
            <h1 style="color:#c9a227;margin:0;">POORNAYU</h1>
            <p style="color:#fff;margin:8px 0 0;">An Investment Hub</p>
          </div>
          <div style="padding:30px;background:#fff;border:1px solid #e2e8f0;">
            <h2 style="color:#002244;">Hello ${name},</h2>
            <p>Thank you for reaching out to <strong>POORNAYU Investment Hub</strong>. We have received your consultation request and our expert advisor will contact you within <strong>24 hours</strong>.</p>
            <div style="background:#f0f7ff;border-left:4px solid #c9a227;padding:16px;margin:20px 0;border-radius:4px;">
              <p style="margin:0;"><strong>Your Request Summary:</strong><br>
              Service Interested: <strong>${service || 'General Consultation'}</strong><br>
              Phone: <strong>${phone}</strong></p>
            </div>
            <p>In the meantime, you can reach us directly:</p>
            <p>📞 <a href="tel:8005561306" style="color:#004080;">80055 61306</a></p>
            <p>💬 <a href="https://wa.me/919414042187" style="color:#25D366;">WhatsApp: 9414042187</a></p>
          </div>
          <div style="background:#002244;padding:16px;text-align:center;">
            <p style="color:#a0aec0;font-size:12px;margin:0;">POORNAYU Investment Hub | Plot No. 2, The Royal Avenue, Sanganer, Jaipur, RJ 302029</p>
          </div>
        </div>
      `
    } : null;

    if (process.env.EMAIL_PASS) {
      await transporter.sendMail(internalMail);
      if (clientMail) await transporter.sendMail(clientMail);
    }

    // Also log the lead to console
    console.log(`[${new Date().toISOString()}] New lead: ${name} | ${phone} | ${service}`);

    res.json({ success: true, message: 'Your message has been received! We\'ll contact you within 24 hours.' });

  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try WhatsApp or call us directly.' });
  }
});

// Get Services API (for dynamic loading if needed)
app.get('/api/services', (req, res) => {
  res.json({
    success: true,
    services: [
      { id: 1, name: 'Post Office Schemes', icon: 'fa-piggy-bank', description: 'Government-backed savings with guaranteed returns' },
      { id: 2, name: 'Mediclaim Policies', icon: 'fa-heartbeat', description: 'Comprehensive health insurance coverage' },
      { id: 3, name: 'Life & Vehicle Insurance', icon: 'fa-shield-alt', description: 'Term life, motor, and personal accident solutions' },
      { id: 4, name: 'Real Estate Investment', icon: 'fa-building', description: 'Expert real estate advisory for long-term growth' },
      { id: 5, name: 'Alternative Investments', icon: 'fa-chart-line', description: 'Diversified high-potential investment strategies' },
      { id: 6, name: 'Media & Advertisement', icon: 'fa-newspaper', description: 'Strategic print and digital media advertising' }
    ]
  });
});

// Stats API
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      clients: 5000,
      yearsExperience: 20,
      services: 6,
      satisfactionRate: 100,
      assetsManaged: '100Cr+'
    }
  });
});

// ---- Catch-all route (SPA fallback) ----
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ---- Start Server ----
app.listen(PORT, () => {
  console.log(`🚀 POORNAYU server running at http://localhost:${PORT}`);
});

module.exports = app;
