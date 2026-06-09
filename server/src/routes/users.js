const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows: userRows } = await pool.query(`
      SELECT
        u.id, u.display_name, u.avatar_url, u.credits,
        u.total_predictions, u.correct_predictions, u.streak, u.max_streak,
        CASE WHEN u.total_predictions > 0
          THEN ROUND(u.correct_predictions::numeric / u.total_predictions * 100, 1)
          ELSE 0
        END AS accuracy_pct,
        (
          SELECT COUNT(*) + 1 FROM users
          WHERE total_predictions > 0
            AND correct_predictions::numeric / total_predictions >
                CASE WHEN u.total_predictions > 0
                  THEN u.correct_predictions::numeric / u.total_predictions ELSE -1 END
        ) AS rank
      FROM users u WHERE u.id = $1
    `, [req.user.userId]);

    if (!userRows[0]) return res.status(404).json({ error: 'User not found' });

    const { rows: voteRows } = await pool.query(`
      SELECT
        v.option_index, v.created_at,
        p.id AS prediction_id, p.question, p.options,
        p.resolved, p.correct_option, p.deadline
      FROM votes v
      JOIN predictions p ON p.id = v.prediction_id
      WHERE v.user_id = $1
      ORDER BY v.created_at DESC
    `, [req.user.userId]);

    res.json({ ...userRows[0], votes: voteRows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /users/rank — just my rank (lightweight for header)
router.get('/rank', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.streak,
        u.credits,
        CASE WHEN u.total_predictions > 0
          THEN ROUND(u.correct_predictions::numeric / u.total_predictions * 100, 1)
          ELSE 0
        END AS accuracy_pct,
        (
          SELECT COUNT(*) + 1 FROM users
          WHERE total_predictions > 0
            AND correct_predictions::numeric / total_predictions >
                CASE WHEN u.total_predictions > 0
                  THEN u.correct_predictions::numeric / u.total_predictions ELSE 1 END
        ) AS rank,
        u.total_predictions
      FROM users u WHERE u.id = $1
    `, [req.user.userId]);
    res.json(rows[0] || { rank: null, streak: 0, credits: 0, accuracy_pct: 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
