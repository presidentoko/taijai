const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const SELECT_PREDICTION = `
  SELECT
    p.id, p.question, p.options, p.deadline, p.resolved,
    p.correct_option, p.category, p.created_at,
    ARRAY[
      (SELECT COUNT(*)::int FROM votes WHERE prediction_id = p.id AND option_index = 0),
      (SELECT COUNT(*)::int FROM votes WHERE prediction_id = p.id AND option_index = 1)
    ] AS vote_counts,
    (SELECT COUNT(*)::int FROM comments WHERE prediction_id = p.id) AS comment_count,
    (p.deadline - NOW()) < INTERVAL '24 hours' AND p.deadline > NOW() AND NOT p.resolved AS closing_soon
  FROM predictions p
`;

router.get('/', async (req, res) => {
  const { category } = req.query;
  try {
    const { rows } = await pool.query(`
      ${SELECT_PREDICTION}
      ${category ? 'WHERE p.category = $1' : ''}
      ORDER BY p.resolved ASC, p.deadline ASC, p.created_at DESC
    `, category ? [category] : []);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_PREDICTION} WHERE p.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
