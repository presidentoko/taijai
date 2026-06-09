const express = require('express');
const router = express.Router({ mergeParams: true });
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /predictions/:id/comments
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.content, c.created_at,
        u.display_name, u.avatar_url, u.streak,
        c.user_id
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.prediction_id = $1
      ORDER BY c.created_at ASC
      LIMIT 100
    `, [req.params.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /predictions/:id/comments
router.post('/', requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim().length === 0) return res.status(400).json({ error: 'Empty comment' });
  if (content.length > 300) return res.status(400).json({ error: 'Too long (max 300)' });

  try {
    const { rows } = await pool.query(`
      INSERT INTO comments (prediction_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, content, created_at, user_id
    `, [req.params.id, req.user.userId, content.trim()]);

    const comment = rows[0];
    res.status(201).json({
      ...comment,
      display_name: req.user.displayName,
      avatar_url: null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /predictions/:id/comments/:commentId
router.delete('/:commentId', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2',
      [req.params.commentId, req.user.userId]
    );
    if (rowCount === 0) return res.status(403).json({ error: 'Not your comment' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
