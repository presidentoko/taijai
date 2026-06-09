const express = require('express');
const router = express.Router();
const generatePayload = require('promptpay-qr');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const CREDIT_PACKAGES = [
  { thb: 20, credits: 100 },
  { thb: 50, credits: 300 },
  { thb: 100, credits: 700 },
];

// GET /payments/packages
router.get('/packages', (req, res) => {
  res.json(CREDIT_PACKAGES);
});

// GET /payments/qr?amount=20 — generate PromptPay QR payload
router.get('/qr', (req, res) => {
  const phone = process.env.PROMPTPAY_PHONE;
  if (!phone) return res.status(500).json({ error: 'PromptPay not configured' });

  const amount = parseFloat(req.query.amount);
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const payload = generatePayload(phone, { amount });
  res.json({ payload, phone, amount });
});

// POST /payments/request — log a pending payment request
router.post('/request', requireAuth, async (req, res) => {
  const { thb } = req.body;
  const pkg = CREDIT_PACKAGES.find(p => p.thb === thb);
  if (!pkg) return res.status(400).json({ error: 'Invalid package' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, amount_thb, credits, status)
       VALUES ($1, $2, $3, 'pending') RETURNING id`,
      [req.user.userId, pkg.thb, pkg.credits]
    );
    res.json({ transactionId: rows[0].id, ...pkg });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
