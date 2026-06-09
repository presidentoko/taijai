const jwt = require('jsonwebtoken');

function makeToken(userId = 'test-user-id', lineId = 'test-line-id') {
  return jwt.sign(
    { userId, lineId, displayName: 'Test User' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '7d' }
  );
}

module.exports = { makeToken };
