require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { runMigrations } = require('./db');

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o.trim()))) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/predictions', require('./routes/predictions'));
app.use('/predictions/:id/comments', require('./routes/comments'));
app.use('/votes', require('./routes/votes'));
app.use('/leaderboard', require('./routes/leaderboard'));
app.use('/users', require('./routes/users'));
app.use('/payments', require('./routes/payments'));
app.use('/suggestions', require('./routes/suggestions'));
app.use('/admin', require('./routes/admin'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  runMigrations().then(() =>
    app.listen(PORT, () => console.log('Server on port ' + PORT))
  );
} else {
  runMigrations().catch(console.error);
}

module.exports = app;
