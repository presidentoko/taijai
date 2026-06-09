const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  const { period } = req.query; // 'week' | 'month' | all
  try {
    let rows;
    if (period === 'week' || period === 'month') {
      const interval = period === 'week' ? '7 days' : '30 days';
      const result = await pool.query(`
        SELECT
          u.id, u.display_name, u.avatar_url, u.streak,
          COUNT(v.id)::int AS total_predictions,
          SUM(CASE WHEN v.option_index = p.correct_option THEN 1 ELSE 0 END)::int AS correct_predictions,
          CASE WHEN COUNT(v.id) > 0
            THEN ROUND(SUM(CASE WHEN v.option_index = p.correct_option THEN 1 ELSE 0 END)::numeric / COUNT(v.id) * 100, 1)
            ELSE 0
          END AS accuracy_pct
        FROM users u
        JOIN votes v ON v.user_id = u.id
        JOIN predictions p ON p.id = v.prediction_id AND p.resolved = TRUE
        WHERE v.created_at > NOW() - INTERVAL '${interval}'
        GROUP BY u.id, u.display_name, u.avatar_url, u.streak
        HAVING COUNT(v.id) > 0
        ORDER BY accuracy_pct DESC, total_predictions DESC
        LIMIT 50
      `);
      rows = result.rows;
    } else {
      const result = await pool.query(`
        SELECT
          id, display_name, avatar_url,
          total_predictions, correct_predictions, streak, max_streak,
          ROUND(correct_predictions::numeric / total_predictions * 100, 1) AS accuracy_pct
        FROM users
        WHERE total_predictions > 0
        ORDER BY correct_predictions::numeric / total_predictions DESC, total_predictions DESC
        LIMIT 50
      `);
      rows = result.rows;
    }
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
