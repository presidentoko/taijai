const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.use((req, res, next) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

router.get('/predictions', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*,
        ARRAY[
          (SELECT COUNT(*)::int FROM votes WHERE prediction_id = p.id AND option_index = 0),
          (SELECT COUNT(*)::int FROM votes WHERE prediction_id = p.id AND option_index = 1)
        ] AS vote_counts
      FROM predictions p ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/predictions', async (req, res) => {
  const { question, options, deadline, category = 'general' } = req.body;
  if (!question || !Array.isArray(options) || options.length !== 2 || !deadline) {
    return res.status(400).json({ error: 'question, options[2], deadline required' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO predictions (question, options, deadline, category) VALUES ($1, $2, $3, $4) RETURNING *`,
      [question, options, deadline, category]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/predictions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM predictions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/predictions/:id/resolve', async (req, res) => {
  const { correctOption } = req.body;
  if (correctOption !== 0 && correctOption !== 1) {
    return res.status(400).json({ error: 'correctOption must be 0 or 1' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE predictions SET resolved = TRUE, correct_option = $1 WHERE id = $2`,
      [correctOption, req.params.id]
    );

    await client.query(`
      UPDATE users SET total_predictions = total_predictions + 1
      WHERE id IN (SELECT user_id FROM votes WHERE prediction_id = $1)
    `, [req.params.id]);

    await client.query(`
      UPDATE users SET correct_predictions = correct_predictions + 1
      WHERE id IN (
        SELECT user_id FROM votes WHERE prediction_id = $1 AND option_index = $2
      )
    `, [req.params.id, correctOption]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM predictions) AS total_predictions,
        (SELECT COUNT(*) FROM predictions WHERE resolved = true) AS resolved_predictions,
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM votes) AS total_votes
    `);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
