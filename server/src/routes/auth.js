const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

router.get('/line', (req, res) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_CLIENT_ID,
    redirect_uri: process.env.LINE_REDIRECT_URI,
    state: Math.random().toString(36).slice(2),
    scope: 'profile openid',
  });
  res.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params}`);
});

router.get('/line/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');

  try {
    const tokenRes = await axios.post(
      'https://api.line.me/oauth2/v2.1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINE_REDIRECT_URI,
        client_id: process.env.LINE_CLIENT_ID,
        client_secret: process.env.LINE_CLIENT_SECRET,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const profileRes = await axios.get('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
    });

    const { userId: lineId, displayName, pictureUrl } = profileRes.data;

    const { rows } = await pool.query(`
      INSERT INTO users (line_id, display_name, avatar_url)
      VALUES ($1, $2, $3)
      ON CONFLICT (line_id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url
      RETURNING id
    `, [lineId, displayName, pictureUrl || null]);

    const token = jwt.sign(
      { userId: rows[0].id, lineId, displayName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (e) {
    console.error('Line OAuth error:', e.response?.data || e.message);
    res.status(500).send('Auth failed');
  }
});

// Dev-only bypass: GET /auth/dev?name=TestUser
router.get('/dev', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not found');
  }
  const displayName = req.query.name || 'Dev User';
  const lineId = `dev_${displayName.replace(/\s/g, '_').toLowerCase()}`;

  const { rows } = await pool.query(`
    INSERT INTO users (line_id, display_name)
    VALUES ($1, $2)
    ON CONFLICT (line_id) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING id
  `, [lineId, displayName]);

  const token = jwt.sign(
    { userId: rows[0].id, lineId, displayName },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

module.exports = router;
