const https = require('https');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function call(method, body) {
  if (!TOKEN) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TOKEN}/${method}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Send payment approval request to admin
async function notifyPayment({ txId, userId, displayName, thb, credits }) {
  if (!TOKEN || !CHAT_ID) return;
  await call('sendMessage', {
    chat_id: CHAT_ID,
    text: `💰 *คำขอเติมเครดิต*\n\n👤 ${displayName}\n💵 ฿${thb} → ${credits} เครดิต\n🆔 \`${txId}\`\n\nตรวจสอบสลิปก่อนอนุมัติ`,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ อนุมัติ', callback_data: `approve:${txId}:${userId}:${credits}` },
        { text: '❌ ปฏิเสธ', callback_data: `reject:${txId}` },
      ]],
    },
  });
}

// Notify user when prediction resolves (via admin group message)
async function notifyResolve({ question, correctOption }) {
  if (!TOKEN || !CHAT_ID) return;
  await call('sendMessage', {
    chat_id: CHAT_ID,
    text: `🎯 *เฉลยแล้ว!*\n\n${question}\n✅ คำตอบ: *${correctOption}*`,
    parse_mode: 'Markdown',
  });
}

async function answerCallback(callbackQueryId, text) {
  return call('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
}

async function editMessage(chatId, messageId, text) {
  return call('editMessageText', { chat_id: chatId, message_id: messageId, text, parse_mode: 'Markdown' });
}

module.exports = { notifyPayment, notifyResolve, answerCallback, editMessage };
