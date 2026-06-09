const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.use((req, res, next) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

router.post('/predictions', async (req, res) => {
  const { question, options, deadline } = req.body;
  if (!question || !Array.isArray(options) || options.length !== 2 || !deadline) {
    return res.status(400).json({ error: 'question, options[2], deadline required' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO predictions (question, options, deadline) VALUES ($1, $2, $3) RETURNING *`,
      [question, options, deadline]
    );
    res.status(201).json(rows[0]);
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

module.exports = router;
