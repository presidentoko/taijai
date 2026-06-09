const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { notifyResolve } = require('../services/telegram');

router.use((req, res, next) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

router.get('/stats', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM predictions) AS total_predictions,
        (SELECT COUNT(*) FROM predictions WHERE resolved = true) AS resolved_predictions,
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM votes) AS total_votes,
        (SELECT COUNT(*) FROM transactions WHERE status = 'pending') AS pending_payments,
        (SELECT COUNT(*) FROM suggestions WHERE status = 'pending') AS pending_suggestions
    `);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Predictions ---

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

    // Update total_predictions for all voters
    await client.query(`
      UPDATE users SET total_predictions = total_predictions + 1
      WHERE id IN (SELECT user_id FROM votes WHERE prediction_id = $1)
    `, [req.params.id]);

    // Correct voters: increment correct_predictions and streak
    await client.query(`
      UPDATE users SET
        correct_predictions = correct_predictions + 1,
        streak = streak + 1,
        max_streak = GREATEST(max_streak, streak + 1)
      WHERE id IN (
        SELECT user_id FROM votes WHERE prediction_id = $1 AND option_index = $2
      )
    `, [req.params.id, correctOption]);

    // Wrong voters: reset streak
    const wrongOption = correctOption === 0 ? 1 : 0;
    await client.query(`
      UPDATE users SET streak = 0
      WHERE id IN (
        SELECT user_id FROM votes WHERE prediction_id = $1 AND option_index = $2
      )
    `, [req.params.id, wrongOption]);

    await client.query('COMMIT');

    const { rows: pred } = await pool.query(
      'SELECT question, options FROM predictions WHERE id = $1', [req.params.id]
    );
    if (pred[0]) {
      notifyResolve({ question: pred[0].question, correctOption: pred[0].options[correctOption] }).catch(() => {});
    }

    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// --- Users / Credits ---

router.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.display_name, u.avatar_url, u.credits,
        u.total_predictions, u.correct_predictions, u.streak, u.max_streak,
        u.created_at,
        COALESCE((
          SELECT json_agg(t ORDER BY t.created_at DESC) FROM (
            SELECT id, amount_thb, credits, status, created_at
            FROM transactions WHERE user_id = u.id AND status = 'pending'
          ) t
        ), '[]') AS pending_payments
      FROM users u ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/users/:id/credits', async (req, res) => {
  const { credits, transactionId, note } = req.body;
  if (!credits || credits <= 0) return res.status(400).json({ error: 'credits must be positive' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE users SET credits = credits + $1 WHERE id = $2',
      [credits, req.params.id]
    );
    if (transactionId) {
      await client.query(
        `UPDATE transactions SET status = 'completed', paid_at = NOW() WHERE id = $1`,
        [transactionId]
      );
    } else {
      await client.query(
        `INSERT INTO transactions (user_id, amount_thb, credits, status, paid_at)
         VALUES ($1, 0, $2, 'manual', NOW())`,
        [req.params.id, credits]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// --- Suggestions ---

router.get('/suggestions', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, u.display_name FROM suggestions s
      JOIN users u ON u.id = s.user_id
      WHERE s.status = 'pending'
      ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/suggestions/:id/approve', async (req, res) => {
  const { deadline, category } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: s } = await client.query('SELECT * FROM suggestions WHERE id = $1', [req.params.id]);
    if (!s[0]) return res.status(404).json({ error: 'Not found' });
    await client.query(
      `INSERT INTO predictions (question, options, deadline, category, suggested_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [s[0].question, [s[0].option_a, s[0].option_b], deadline, category || s[0].category, s[0].user_id]
    );
    await client.query(`UPDATE suggestions SET status = 'approved' WHERE id = $1`, [req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.post('/suggestions/:id/reject', async (req, res) => {
  try {
    await pool.query(`UPDATE suggestions SET status = 'rejected' WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Weekly Prizes ---

function getWeekKey() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const y = monday.getFullYear();
  const w = String(Math.ceil((((monday - new Date(y, 0, 1)) / 86400000) + 1) / 7)).padStart(2, '0');
  return `${y}-W${w}`;
}

// GET /admin/weekly — current week leaderboard + prize config
router.get('/weekly', async (req, res) => {
  try {
    const weekKey = getWeekKey();
    const weekStart = (() => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return monday.toISOString();
    })();

    const [leaderboard, config, payouts] = await Promise.all([
      pool.query(`
        SELECT u.id, u.display_name, u.avatar_url,
          COUNT(v.id)::int AS total_votes,
          SUM(CASE WHEN v.option_index = p.correct_option THEN 1 ELSE 0 END)::int AS correct,
          CASE WHEN COUNT(v.id) > 0
            THEN ROUND(SUM(CASE WHEN v.option_index = p.correct_option THEN 1 ELSE 0 END)::numeric / COUNT(v.id) * 100, 1)
            ELSE 0
          END AS accuracy_pct
        FROM users u
        JOIN votes v ON v.user_id = u.id AND v.created_at >= $1
        JOIN predictions p ON p.id = v.prediction_id AND p.resolved = TRUE
        GROUP BY u.id, u.display_name, u.avatar_url
        HAVING COUNT(v.id) > 0
        ORDER BY accuracy_pct DESC, total_votes DESC
        LIMIT 20
      `, [weekStart]),
      pool.query('SELECT * FROM weekly_config WHERE week_key = $1', [weekKey]),
      pool.query('SELECT * FROM weekly_payouts WHERE week_key = $1', [weekKey]),
    ]);

    res.json({
      weekKey,
      leaderboard: leaderboard.rows,
      config: config.rows[0] || { prize_1st: 0, prize_2nd: 0, prize_3rd: 0 },
      payouts: payouts.rows,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/weekly/prize — set prize amounts
router.post('/weekly/prize', async (req, res) => {
  const { prize1st, prize2nd, prize3rd } = req.body;
  try {
    const weekKey = getWeekKey();
    await pool.query(`
      INSERT INTO weekly_config (week_key, prize_1st, prize_2nd, prize_3rd)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (week_key) DO UPDATE
        SET prize_1st = $2, prize_2nd = $3, prize_3rd = $4
    `, [weekKey, prize1st || 0, prize2nd || 0, prize3rd || 0]);
    res.json({ success: true, weekKey });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/weekly/payout — mark winner as paid
router.post('/weekly/payout', async (req, res) => {
  const { userId, rank, prizeThb } = req.body;
  try {
    const weekKey = getWeekKey();
    await pool.query(`
      INSERT INTO weekly_payouts (week_key, user_id, rank, prize_thb, paid, paid_at)
      VALUES ($1, $2, $3, $4, TRUE, NOW())
      ON CONFLICT (week_key, rank) DO UPDATE SET paid = TRUE, paid_at = NOW()
    `, [weekKey, userId, rank, prizeThb]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
