const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        display_name,
        avatar_url,
        total_predictions,
        correct_predictions,
        streak,
        max_streak,
        ROUND(correct_predictions::numeric / total_predictions * 100, 1) AS accuracy_pct
      FROM users
      WHERE total_predictions > 0
      ORDER BY correct_predictions::numeric / total_predictions DESC, total_predictions DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
