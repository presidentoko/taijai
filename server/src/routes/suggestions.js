const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

// POST /suggestions — user submits a prediction idea
router.post('/', requireAuth, async (req, res) => {
  const { question, option_a, option_b, category = 'general' } = req.body;
  if (!question || !option_a || !option_b) {
    return res.status(400).json({ error: 'question, option_a, option_b required' });
  }
  try {
    await pool.query(
      `INSERT INTO suggestions (user_id, question, option_a, option_b, category)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.userId, question.trim(), option_a.trim(), option_b.trim(), category]
    );
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
