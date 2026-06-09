const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, async (req, res) => {
  const { predictionId, optionIndex } = req.body;
  const userId = req.user.userId;

  if (optionIndex !== 0 && optionIndex !== 1) {
    return res.status(400).json({ error: 'optionIndex must be 0 or 1' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO votes (prediction_id, user_id, option_index)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [predictionId, userId, optionIndex]
    );
    res.status(201).json({ vote: rows[0] });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Already voted on this prediction' });
    }
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
