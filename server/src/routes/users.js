const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /users/me — current user profile + vote history
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows: userRows } = await pool.query(
      `SELECT id, display_name, avatar_url, total_predictions, correct_predictions,
        CASE WHEN total_predictions > 0
          THEN ROUND(correct_predictions::numeric / total_predictions * 100, 1)
          ELSE 0
        END AS accuracy_pct
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (!userRows[0]) return res.status(404).json({ error: 'User not found' });

    const { rows: voteRows } = await pool.query(
      `SELECT
        v.option_index, v.created_at,
        p.id AS prediction_id, p.question, p.options,
        p.resolved, p.correct_option, p.deadline
       FROM votes v
       JOIN predictions p ON p.id = v.prediction_id
       WHERE v.user_id = $1
       ORDER BY v.created_at DESC`,
      [req.user.userId]
    );

    res.json({ ...userRows[0], votes: voteRows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
