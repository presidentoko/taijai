const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { answerCallback, editMessage } = require('../services/telegram');

// POST /telegram/webhook — receives Telegram bot callbacks
router.post('/webhook', async (req, res) => {
  res.sendStatus(200); // always respond fast to Telegram

  const { callback_query } = req.body;
  if (!callback_query) return;

  const { id: cbId, data, message } = callback_query;
  const [action, txId, userId, credits] = data.split(':');

  const client = await pool.connect();
  try {
    if (action === 'approve') {
      await client.query('BEGIN');
      await client.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [parseInt(credits), userId]);
      await client.query(`UPDATE transactions SET status = 'completed', paid_at = NOW() WHERE id = $1`, [txId]);
      await client.query('COMMIT');
      await answerCallback(cbId, `✅ เติม ${credits} เครดิตแล้ว`);
      await editMessage(message.chat.id, message.message_id, `✅ *อนุมัติแล้ว*\n\nID: \`${txId}\`\nเครดิต: ${credits}`);
    } else if (action === 'reject') {
      await pool.query(`UPDATE transactions SET status = 'rejected' WHERE id = $1`, [txId]);
      await answerCallback(cbId, '❌ ปฏิเสธแล้ว');
      await editMessage(message.chat.id, message.message_id, `❌ *ปฏิเสธแล้ว*\n\nID: \`${txId}\``);
    }
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Telegram webhook error:', e.message);
  } finally {
    client.release();
  }
});

// GET /telegram/set-webhook — call once after deploy to register webhook URL
router.get('/set-webhook', async (req, res) => {
  if (req.query.secret !== process.env.ADMIN_SECRET) return res.status(403).send('Forbidden');
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `${process.env.BACKEND_URL}/telegram/webhook`;
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await response.json();
  res.json(data);
});

module.exports = router;
