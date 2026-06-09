require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { runMigrations } = require('./db');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/predictions', require('./routes/predictions'));
app.use('/votes', require('./routes/votes'));
app.use('/leaderboard', require('./routes/leaderboard'));
app.use('/users', require('./routes/users'));
app.use('/payments', require('./routes/payments'));
app.use('/admin', require('./routes/admin'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  runMigrations().then(() =>
    app.listen(PORT, () => console.log('Server on port ' + PORT))
  );
}

module.exports = app;
