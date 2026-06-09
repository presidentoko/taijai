const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const FREE_VOTES_PER_WEEK = 5;
const CREDIT_COST_PER_VOTE = 50;

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

router.post('/', requireAuth, async (req, res) => {
  const { predictionId, optionIndex } = req.body;
  const userId = req.user.userId;

  if (optionIndex !== 0 && optionIndex !== 1) {
    return res.status(400).json({ error: 'optionIndex must be 0 or 1' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const weekStart = getWeekStart();
    const { rows: weekRows } = await client.query(
      `SELECT COUNT(*)::int AS count FROM votes WHERE user_id = $1 AND created_at >= $2`,
      [userId, weekStart]
    );
    const weeklyCount = weekRows[0].count;

    if (weeklyCount >= FREE_VOTES_PER_WEEK) {
      const { rows: userRows } = await client.query(
        'SELECT credits FROM users WHERE id = $1',
        [userId]
      );
      const credits = userRows[0]?.credits || 0;
      if (credits < CREDIT_COST_PER_VOTE) {
        await client.query('ROLLBACK');
        return res.status(402).json({
          error: 'insufficient_credits',
          weeklyVotes: weeklyCount,
          freeLimit: FREE_VOTES_PER_WEEK,
          creditCost: CREDIT_COST_PER_VOTE,
          credits,
        });
      }
      await client.query(
        'UPDATE users SET credits = credits - $1 WHERE id = $2',
        [CREDIT_COST_PER_VOTE, userId]
      );
    }

    const { rows } = await client.query(
      `INSERT INTO votes (prediction_id, user_id, option_index)
       VALUES ($1, $2, $3) RETURNING *`,
      [predictionId, userId, optionIndex]
    );

    await client.query('COMMIT');
    res.status(201).json({
      vote: rows[0],
      weeklyVotes: weeklyCount + 1,
      freeLimit: FREE_VOTES_PER_WEEK,
      paid: weeklyCount >= FREE_VOTES_PER_WEEK,
    });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Already voted on this prediction' });
    }
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// GET /votes/weekly-status — how many votes used this week
router.get('/weekly-status', requireAuth, async (req, res) => {
  try {
    const weekStart = getWeekStart();
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS used FROM votes WHERE user_id = $1 AND created_at >= $2`,
      [req.user.userId, weekStart]
    );
    const used = rows[0].used;
    res.json({
      used,
      free: FREE_VOTES_PER_WEEK,
      remaining: Math.max(0, FREE_VOTES_PER_WEEK - used),
      creditCost: CREDIT_COST_PER_VOTE,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
