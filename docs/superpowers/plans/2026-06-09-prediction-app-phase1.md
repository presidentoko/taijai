# 예측 앱 (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 태국 유저 대상 예측/투표 웹앱 Phase 1 — Line 로그인, 예측 투표, 정확도 기반 순위판 (결제 없음)

**Architecture:** Express.js + PostgreSQL 백엔드 (Railway), React + Vite 프론트엔드 (Vercel). Line OAuth 2.0으로 로그인, JWT 7일 세션. 투표 중복 방지는 DB UNIQUE 제약. 투표 수 갱신은 3초 폴링.

**Tech Stack:** Node.js 20, Express 4, pg, jsonwebtoken, axios, React 18, Vite 5, TailwindCSS 3, React Router 6, Jest + Supertest (백엔드), Vitest + React Testing Library (프론트엔드)

---

## 파일 구조

```
games/
├── server/
│   ├── src/
│   │   ├── index.js                   Express 앱 진입점
│   │   ├── db.js                      PostgreSQL Pool + 마이그레이션
│   │   ├── middleware/
│   │   │   └── auth.js                JWT 검증 미들웨어
│   │   └── routes/
│   │       ├── auth.js                Line OAuth 2.0
│   │       ├── predictions.js         예측 목록/상세
│   │       ├── votes.js               투표 제출
│   │       ├── leaderboard.js         순위판
│   │       └── admin.js               예측 추가 + 정답 처리
│   ├── migrations/
│   │   └── 001_init.sql
│   ├── tests/
│   │   ├── helpers.js
│   │   ├── predictions.test.js
│   │   ├── votes.test.js
│   │   └── leaderboard.test.js
│   ├── .env.example
│   └── package.json
└── client/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   ├── test-setup.js
    │   ├── api.js
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   ├── useAuth.test.js
    │   │   └── usePredictions.js
    │   ├── components/
    │   │   ├── LineLoginButton.jsx
    │   │   ├── PredictionCard.jsx
    │   │   ├── VoteButtons.jsx
    │   │   └── VoteButtons.test.jsx
    │   └── pages/
    │       ├── Home.jsx
    │       ├── PredictionDetail.jsx
    │       ├── Leaderboard.jsx
    │       └── AuthCallback.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vercel.json
    ├── .env.example
    └── package.json
```

---

## Task 1: Monorepo 구조 + 패키지 설정

**Files:**
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `client/package.json`
- Create: `client/.env.example`
- Create: `.gitignore`

- [ ] **Step 1: server/package.json 생성**

```json
{
  "name": "prediction-server",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.12.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.3",
    "supertest": "^7.0.0"
  },
  "jest": {
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: server/.env.example 생성**

```
DATABASE_URL=postgresql://user:password@host:5432/prediction_db
JWT_SECRET=change_this_secret
LINE_CLIENT_ID=your_line_client_id
LINE_CLIENT_SECRET=your_line_client_secret
LINE_REDIRECT_URI=http://localhost:3001/auth/line/callback
FRONTEND_URL=http://localhost:5173
ADMIN_SECRET=change_this_admin_secret
PORT=3001
```

- [ ] **Step 3: client/package.json 생성**

```json
{
  "name": "prediction-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.0",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.6",
    "vite": "^5.3.3",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 4: client/.env.example 생성**

```
VITE_API_URL=http://localhost:3001
```

- [ ] **Step 5: .gitignore 생성**

```
node_modules/
.env
dist/
.DS_Store
```

- [ ] **Step 6: 의존성 설치**

```bash
cd server && npm install
cd ../client && npm install
```

Expected: `server/node_modules/`, `client/node_modules/` 생성됨

- [ ] **Step 7: 커밋**

```bash
git init
git add server/package.json server/.env.example client/package.json client/.env.example .gitignore
git commit -m "chore: monorepo setup"
```

---

## Task 2: DB 스키마 + 마이그레이션

**Files:**
- Create: `server/migrations/001_init.sql`
- Create: `server/src/db.js`

- [ ] **Step 1: 마이그레이션 SQL 작성**

`server/migrations/001_init.sql`:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS predictions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question       TEXT NOT NULL,
  options        TEXT[] NOT NULL,
  deadline       TIMESTAMPTZ NOT NULL,
  resolved       BOOLEAN DEFAULT FALSE,
  correct_option INT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_id             TEXT UNIQUE NOT NULL,
  display_name        TEXT,
  avatar_url          TEXT,
  total_predictions   INT DEFAULT 0,
  correct_predictions INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  option_index  INT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_id, user_id)
);
```

- [ ] **Step 2: db.js 작성**

`server/src/db.js`:
```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const sql = fs.readFileSync(
    path.join(__dirname, '../migrations/001_init.sql'),
    'utf8'
  );
  await pool.query(sql);
  console.log('Migrations complete');
}

module.exports = { pool, runMigrations };
```

- [ ] **Step 3: .env 파일 생성 (로컬 PostgreSQL URL로 수정)**

```bash
cp server/.env.example server/.env
# DATABASE_URL을 실제 로컬 PostgreSQL URL로 수정
```

- [ ] **Step 4: 마이그레이션 실행 확인**

```bash
cd server && node -e "
const { pool, runMigrations } = require('./src/db');
runMigrations()
  .then(() => { console.log('OK'); pool.end(); })
  .catch(e => { console.error(e); process.exit(1); });
"
```

Expected: `Migrations complete`, `OK`

- [ ] **Step 5: 커밋**

```bash
git add server/migrations/001_init.sql server/src/db.js
git commit -m "feat: database schema and migration runner"
```

---

## Task 3: Express 서버 + JWT 미들웨어

**Files:**
- Create: `server/src/index.js`
- Create: `server/src/middleware/auth.js`
- Create: `server/tests/helpers.js`
- Create (빈 라우트): `server/src/routes/auth.js`, `predictions.js`, `votes.js`, `leaderboard.js`, `admin.js`

- [ ] **Step 1: 테스트 헬퍼 작성**

`server/tests/helpers.js`:
```javascript
const jwt = require('jsonwebtoken');

function makeToken(userId = 'test-user-id', lineId = 'test-line-id') {
  return jwt.sign(
    { userId, lineId, displayName: 'Test User' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '7d' }
  );
}

module.exports = { makeToken };
```

- [ ] **Step 2: JWT 미들웨어 작성**

`server/src/middleware/auth.js`:
```javascript
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { requireAuth };
```

- [ ] **Step 3: 빈 라우트 파일들 생성**

각 파일에 아래 내용으로 생성:

`server/src/routes/auth.js`, `predictions.js`, `votes.js`, `leaderboard.js`, `admin.js`:
```javascript
const express = require('express');
const router = express.Router();
module.exports = router;
```

- [ ] **Step 4: Express 서버 작성**

`server/src/index.js`:
```javascript
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
app.use('/admin', require('./routes/admin'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  runMigrations().then(() =>
    app.listen(PORT, () => console.log(`Server on port ${PORT}`))
  );
}

module.exports = app;
```

- [ ] **Step 5: 서버 시작 + health 확인**

```bash
cd server && node src/index.js
```

Expected: `Migrations complete`, `Server on port 3001`

```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 6: 커밋**

```bash
git add server/src/
git commit -m "feat: express server with jwt auth middleware"
```

---

## Task 4: Predictions API

**Files:**
- Modify: `server/src/routes/predictions.js`
- Create: `server/tests/predictions.test.js`

- [ ] **Step 1: 테스트 작성**

`server/tests/predictions.test.js`:
```javascript
const request = require('supertest');
const app = require('../src/index');
const { pool } = require('../src/db');

const PRED_ID = '00000000-0000-0000-0000-000000000001';

beforeAll(async () => {
  await pool.query(`
    INSERT INTO predictions (id, question, options, deadline)
    VALUES ($1, 'ทดสอบ', ARRAY['ใช่', 'ไม่ใช่'], NOW() + INTERVAL '7 days')
    ON CONFLICT (id) DO NOTHING
  `, [PRED_ID]);
});

afterAll(async () => {
  await pool.query('DELETE FROM predictions WHERE id = $1', [PRED_ID]);
  await pool.end();
});

test('GET /predictions returns array', async () => {
  const res = await request(app).get('/predictions');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body[0]).toHaveProperty('vote_counts');
});

test('GET /predictions/:id returns prediction with vote_counts', async () => {
  const res = await request(app).get(`/predictions/${PRED_ID}`);
  expect(res.status).toBe(200);
  expect(res.body.question).toBe('ทดสอบ');
  expect(res.body.vote_counts).toEqual([0, 0]);
});

test('GET /predictions/:id 404 for unknown id', async () => {
  const res = await request(app).get('/predictions/00000000-0000-0000-0000-000000000099');
  expect(res.status).toBe(404);
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
cd server && JWT_SECRET=test-secret npx jest tests/predictions.test.js --verbose
```

Expected: FAIL

- [ ] **Step 3: predictions 라우트 구현**

`server/src/routes/predictions.js`:
```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.*,
        ARRAY[
          (SELECT COUNT(*)::int FROM votes WHERE prediction_id = p.id AND option_index = 0),
          (SELECT COUNT(*)::int FROM votes WHERE prediction_id = p.id AND option_index = 1)
        ] AS vote_counts
      FROM predictions p
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.*,
        ARRAY[
          (SELECT COUNT(*)::int FROM votes WHERE prediction_id = p.id AND option_index = 0),
          (SELECT COUNT(*)::int FROM votes WHERE prediction_id = p.id AND option_index = 1)
        ] AS vote_counts
      FROM predictions p
      WHERE p.id = $1
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

```bash
cd server && JWT_SECRET=test-secret npx jest tests/predictions.test.js --verbose
```

Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add server/src/routes/predictions.js server/tests/predictions.test.js
git commit -m "feat: predictions API with vote counts"
```

---

## Task 5: Votes API

**Files:**
- Modify: `server/src/routes/votes.js`
- Create: `server/tests/votes.test.js`

- [ ] **Step 1: 테스트 작성**

`server/tests/votes.test.js`:
```javascript
const request = require('supertest');
const app = require('../src/index');
const { pool } = require('../src/db');
const { makeToken } = require('./helpers');

const PRED_ID = '00000000-0000-0000-0000-000000000002';
const USER_ID = '00000000-0000-0000-0000-000000000010';

beforeAll(async () => {
  await pool.query(`
    INSERT INTO predictions (id, question, options, deadline)
    VALUES ($1, 'โหวตทดสอบ', ARRAY['A', 'B'], NOW() + INTERVAL '7 days')
    ON CONFLICT (id) DO NOTHING
  `, [PRED_ID]);
  await pool.query(`
    INSERT INTO users (id, line_id, display_name)
    VALUES ($1, 'line-test-001', 'Test User')
    ON CONFLICT (line_id) DO NOTHING
  `, [USER_ID]);
});

afterAll(async () => {
  await pool.query('DELETE FROM votes WHERE prediction_id = $1', [PRED_ID]);
  await pool.query('DELETE FROM predictions WHERE id = $1', [PRED_ID]);
  await pool.query('DELETE FROM users WHERE id = $1', [USER_ID]);
  await pool.end();
});

test('POST /votes without auth returns 401', async () => {
  const res = await request(app)
    .post('/votes')
    .send({ predictionId: PRED_ID, optionIndex: 0 });
  expect(res.status).toBe(401);
});

test('POST /votes with valid auth returns 201', async () => {
  const token = makeToken(USER_ID, 'line-test-001');
  const res = await request(app)
    .post('/votes')
    .set('Authorization', `Bearer ${token}`)
    .send({ predictionId: PRED_ID, optionIndex: 0 });
  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('vote');
});

test('POST /votes duplicate returns 409', async () => {
  const token = makeToken(USER_ID, 'line-test-001');
  const res = await request(app)
    .post('/votes')
    .set('Authorization', `Bearer ${token}`)
    .send({ predictionId: PRED_ID, optionIndex: 1 });
  expect(res.status).toBe(409);
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
cd server && JWT_SECRET=test-secret npx jest tests/votes.test.js --verbose
```

Expected: FAIL

- [ ] **Step 3: votes 라우트 구현**

`server/src/routes/votes.js`:
```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, async (req, res) => {
  const { predictionId, optionIndex } = req.body;
  const userId = req.user.userId;

  if (optionIndex !== 0 && optionIndex !== 1) {
    return res.status(400).json({ error: 'optionIndex must be 0 or 1' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO votes (prediction_id, user_id, option_index)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [predictionId, userId, optionIndex]
    );
    res.status(201).json({ vote: rows[0] });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Already voted on this prediction' });
    }
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

```bash
cd server && JWT_SECRET=test-secret npx jest tests/votes.test.js --verbose
```

Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add server/src/routes/votes.js server/tests/votes.test.js
git commit -m "feat: votes API with auth and duplicate prevention"
```

---

## Task 6: Leaderboard API

**Files:**
- Modify: `server/src/routes/leaderboard.js`
- Create: `server/tests/leaderboard.test.js`

- [ ] **Step 1: 테스트 작성**

`server/tests/leaderboard.test.js`:
```javascript
const request = require('supertest');
const app = require('../src/index');
const { pool } = require('../src/db');

beforeAll(async () => {
  await pool.query(`
    INSERT INTO users (id, line_id, display_name, total_predictions, correct_predictions)
    VALUES
      ('00000000-0000-0000-0000-000000000020', 'line-lb-001', 'ยูเซอร์A', 10, 9),
      ('00000000-0000-0000-0000-000000000021', 'line-lb-002', 'ยูเซอร์B', 5, 3),
      ('00000000-0000-0000-0000-000000000022', 'line-lb-003', 'ยูเซอร์C', 0, 0)
    ON CONFLICT (line_id) DO NOTHING
  `);
});

afterAll(async () => {
  await pool.query(`DELETE FROM users WHERE line_id IN ('line-lb-001','line-lb-002','line-lb-003')`);
  await pool.end();
});

test('GET /leaderboard returns users sorted by accuracy', async () => {
  const res = await request(app).get('/leaderboard');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  const names = res.body.map(u => u.display_name);
  expect(names.indexOf('ยูเซอร์A')).toBeLessThan(names.indexOf('ยูเซอร์B'));
});

test('GET /leaderboard excludes users with 0 predictions', async () => {
  const res = await request(app).get('/leaderboard');
  const hasZero = res.body.some(u => u.total_predictions === 0);
  expect(hasZero).toBe(false);
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
cd server && JWT_SECRET=test-secret npx jest tests/leaderboard.test.js --verbose
```

Expected: FAIL

- [ ] **Step 3: leaderboard 라우트 구현**

`server/src/routes/leaderboard.js`:
```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        display_name,
        avatar_url,
        total_predictions,
        correct_predictions,
        ROUND(correct_predictions::numeric / total_predictions * 100, 1) AS accuracy_pct
      FROM users
      WHERE total_predictions > 0
      ORDER BY correct_predictions::numeric / total_predictions DESC, total_predictions DESC
      LIMIT 20
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

```bash
cd server && JWT_SECRET=test-secret npx jest tests/leaderboard.test.js --verbose
```

Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add server/src/routes/leaderboard.js server/tests/leaderboard.test.js
git commit -m "feat: leaderboard API sorted by accuracy"
```

---

## Task 7: Line OAuth + Admin 라우트

**Files:**
- Modify: `server/src/routes/auth.js`
- Modify: `server/src/routes/admin.js`

- [ ] **Step 1: Line OAuth 라우트 구현**

`server/src/routes/auth.js`:
```javascript
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

module.exports = router;
```

- [ ] **Step 2: Admin 라우트 구현**

`server/src/routes/admin.js`:
```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.use((req, res, next) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

// 예측 추가
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

// 정답 처리 (트랜잭션으로 순위 업데이트)
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
```

- [ ] **Step 3: 어드민으로 테스트 예측 추가**

서버 시작 후:
```bash
curl -X POST http://localhost:3001/admin/predictions \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: change_this_admin_secret" \
  -d '{"question":"ดาราคนนี้จะออกละครเดือนหน้าไหม?","options":["ออกแน่นอน","ไม่ออก"],"deadline":"2026-07-01T00:00:00Z"}'
```

Expected: `201` + 예측 JSON

- [ ] **Step 4: 커밋**

```bash
git add server/src/routes/auth.js server/src/routes/admin.js
git commit -m "feat: line oauth and admin routes"
```

---

## Task 8: React + Vite + TailwindCSS 기반 설정

**Files:**
- Create: `client/index.html`
- Create: `client/vite.config.js`
- Create: `client/tailwind.config.js`
- Create: `client/postcss.config.js`
- Create: `client/src/index.css`
- Create: `client/src/test-setup.js`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `client/src/pages/AuthCallback.jsx`

- [ ] **Step 1: index.html 작성**

`client/index.html`:
```html
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ทายใจ</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 2: vite.config.js 작성**

`client/vite.config.js`:
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
  },
});
```

- [ ] **Step 3: TailwindCSS 설정**

`client/tailwind.config.js`:
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

`client/postcss.config.js`:
```javascript
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

`client/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: 테스트 설정 파일**

`client/src/test-setup.js`:
```javascript
import '@testing-library/jest-dom';
```

- [ ] **Step 5: main.jsx 작성**

`client/src/main.jsx`:
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 6: App.jsx 작성**

`client/src/App.jsx`:
```jsx
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PredictionDetail from './pages/PredictionDetail';
import Leaderboard from './pages/Leaderboard';
import AuthCallback from './pages/AuthCallback';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/predictions/:id" element={<PredictionDetail />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
  );
}
```

- [ ] **Step 7: AuthCallback 페이지 작성**

`client/src/pages/AuthCallback.jsx`:
```jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
    }
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">กำลังเข้าสู่ระบบ...</p>
    </div>
  );
}
```

- [ ] **Step 8: 빈 페이지 파일 생성 (다음 태스크에서 채울 것)**

`client/src/pages/Home.jsx`:
```jsx
export default function Home() { return <div>Home</div>; }
```

`client/src/pages/PredictionDetail.jsx`:
```jsx
export default function PredictionDetail() { return <div>Detail</div>; }
```

`client/src/pages/Leaderboard.jsx`:
```jsx
export default function Leaderboard() { return <div>Leaderboard</div>; }
```

- [ ] **Step 9: 개발 서버 시작 확인**

```bash
cd client && npm run dev
```

Expected: `http://localhost:5173` 접속 시 "Home" 텍스트 표시됨

- [ ] **Step 10: 커밋**

```bash
git add client/
git commit -m "feat: react + vite + tailwind frontend base"
```

---

## Task 9: API 클라이언트 + useAuth + LineLoginButton

**Files:**
- Create: `client/src/api.js`
- Create: `client/src/hooks/useAuth.js`
- Create: `client/src/hooks/useAuth.test.js`
- Create: `client/src/components/LineLoginButton.jsx`

- [ ] **Step 1: api.js 작성**

`client/src/api.js`:
```javascript
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error || res.statusText), { status: res.status });
  }
  return res.json();
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
};
```

- [ ] **Step 2: useAuth 훅 작성**

`client/src/hooks/useAuth.js`:
```javascript
import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        setUser(payload);
      } else {
        localStorage.removeItem('token');
      }
    } catch {
      localStorage.removeItem('token');
    }
  }, []);

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return { user, logout };
}
```

- [ ] **Step 3: useAuth 테스트 작성**

`client/src/hooks/useAuth.test.js`:
```javascript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

beforeEach(() => localStorage.clear());

test('returns null user when no token', () => {
  const { result } = renderHook(() => useAuth());
  expect(result.current.user).toBeNull();
});

test('returns user from valid token', () => {
  const payload = {
    userId: 'u1',
    displayName: 'Test',
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const token = `x.${btoa(JSON.stringify(payload))}.x`;
  localStorage.setItem('token', token);
  const { result } = renderHook(() => useAuth());
  expect(result.current.user?.displayName).toBe('Test');
});

test('logout clears token and user', () => {
  const payload = { userId: 'u1', exp: Math.floor(Date.now() / 1000) + 3600 };
  localStorage.setItem('token', `x.${btoa(JSON.stringify(payload))}.x`);
  const { result } = renderHook(() => useAuth());
  act(() => result.current.logout());
  expect(localStorage.getItem('token')).toBeNull();
  expect(result.current.user).toBeNull();
});
```

- [ ] **Step 4: 테스트 실행**

```bash
cd client && npx vitest run src/hooks/useAuth.test.js
```

Expected: PASS (3 tests)

- [ ] **Step 5: LineLoginButton 작성**

`client/src/components/LineLoginButton.jsx`:
```jsx
export default function LineLoginButton() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return (
    <a
      href={`${apiUrl}/auth/line`}
      className="inline-flex items-center gap-2 bg-[#06C755] text-white px-4 py-2 rounded-lg font-semibold text-sm"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.52 2.32 6.6 5.8 8.32l-.76 2.84 3.28-1.72c.88.24 1.8.36 2.68.36 5.52 0 10-3.92 10-8.8S17.52 2 12 2z"/>
      </svg>
      เข้าสู่ระบบด้วย LINE
    </a>
  );
}
```

- [ ] **Step 6: 커밋**

```bash
git add client/src/api.js client/src/hooks/ client/src/components/LineLoginButton.jsx
git commit -m "feat: api client, useAuth hook, LineLoginButton"
```

---

## Task 10: usePredictions + PredictionCard + VoteButtons

**Files:**
- Create: `client/src/hooks/usePredictions.js`
- Create: `client/src/components/VoteButtons.jsx`
- Create: `client/src/components/VoteButtons.test.jsx`
- Create: `client/src/components/PredictionCard.jsx`

- [ ] **Step 1: usePredictions 훅 작성**

`client/src/hooks/usePredictions.js`:
```javascript
import { useState, useEffect } from 'react';
import { api } from '../api';

export function usePredictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchPredictions() {
    try {
      const data = await api.get('/predictions');
      setPredictions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 3000);
    return () => clearInterval(interval);
  }, []);

  return { predictions, loading, refetch: fetchPredictions };
}

export function usePrediction(id) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchPrediction() {
    try {
      const data = await api.get(`/predictions/${id}`);
      setPrediction(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 3000);
    return () => clearInterval(interval);
  }, [id]);

  return { prediction, loading, refetch: fetchPrediction };
}
```

- [ ] **Step 2: VoteButtons 컴포넌트 작성**

`client/src/components/VoteButtons.jsx`:
```jsx
import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';

export default function VoteButtons({ prediction, onVoted }) {
  const { user } = useAuth();
  const [voted, setVoted] = useState(false);
  const [optimisticCounts, setOptimisticCounts] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const counts = optimisticCounts || prediction.vote_counts || [0, 0];
  const total = counts[0] + counts[1];

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  async function handleVote(optionIndex) {
    if (!user) {
      window.location.href = `${apiUrl}/auth/line`;
      return;
    }
    if (voted || submitting) return;

    const newCounts = [counts[0], counts[1]];
    newCounts[optionIndex] += 1;
    setOptimisticCounts(newCounts);
    setVoted(true);
    setSubmitting(true);

    try {
      await api.post('/votes', { predictionId: prediction.id, optionIndex });
      onVoted?.();
    } catch (e) {
      if (e.status === 409) {
        setVoted(true);
      } else {
        setOptimisticCounts(null);
        setVoted(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!voted) {
    return (
      <div className="space-y-2">
        {prediction.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleVote(idx)}
            className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white py-3 rounded-xl font-semibold text-lg transition-colors"
          >
            {option}
          </button>
        ))}
        {!user && (
          <p className="text-center text-xs text-gray-400 mt-1">
            ต้องเข้าสู่ระบบด้วย LINE ก่อนโหวต
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {prediction.options.map((option, idx) => {
        const pct = total > 0 ? Math.round((counts[idx] / total) * 100) : 0;
        return (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{option}</span>
              <span className="font-bold">{pct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5">
              <div
                className="bg-green-500 h-5 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{counts[idx].toLocaleString()} คน</p>
          </div>
        );
      })}
      <p className="text-center text-sm text-green-600 font-medium mt-2">✅ โหวตแล้ว!</p>
    </div>
  );
}
```

- [ ] **Step 3: VoteButtons 테스트 작성**

`client/src/components/VoteButtons.test.jsx`:
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import VoteButtons from './VoteButtons';

vi.mock('../api', () => ({ api: { post: vi.fn().mockResolvedValue({}) } }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: { userId: 'u1' } }) }));

const prediction = {
  id: 'p1',
  options: ['ใช่', 'ไม่ใช่'],
  vote_counts: [10, 5],
};

test('shows vote buttons before voting', () => {
  render(<VoteButtons prediction={prediction} />);
  expect(screen.getByText('ใช่')).toBeInTheDocument();
  expect(screen.getByText('ไม่ใช่')).toBeInTheDocument();
});

test('shows percentage bars after voting', async () => {
  render(<VoteButtons prediction={prediction} />);
  fireEvent.click(screen.getByText('ใช่'));
  // 11/(11+5) = 68.75% → 69%
  expect(await screen.findByText('69%')).toBeInTheDocument();
});
```

- [ ] **Step 4: 테스트 실행**

```bash
cd client && npx vitest run src/components/VoteButtons.test.jsx
```

Expected: PASS (2 tests)

- [ ] **Step 5: PredictionCard 작성**

`client/src/components/PredictionCard.jsx`:
```jsx
import { Link } from 'react-router-dom';
import VoteButtons from './VoteButtons';

export default function PredictionCard({ prediction, onVoted }) {
  const deadline = new Date(prediction.deadline);
  const isExpired = deadline < new Date();

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
      <p className="text-xs text-gray-400 mb-2">
        {isExpired ? '⏰ หมดเวลา' : `⏰ เฉลยวันที่ ${deadline.toLocaleDateString('th-TH')}`}
      </p>

      <Link to={`/predictions/${prediction.id}`}>
        <h2 className="text-lg font-bold text-gray-800 mb-4 leading-snug hover:text-green-600 transition-colors">
          {prediction.question}
        </h2>
      </Link>

      {prediction.resolved ? (
        <div className="p-3 bg-blue-50 rounded-xl text-center">
          <p className="text-sm font-semibold text-blue-700">
            ✅ เฉลยแล้ว: {prediction.options[prediction.correct_option]}
          </p>
        </div>
      ) : isExpired ? (
        <div className="p-3 bg-gray-50 rounded-xl text-center text-gray-400 text-sm">
          หมดเวลาโหวต — รอเฉลย
        </div>
      ) : (
        <VoteButtons prediction={prediction} onVoted={onVoted} />
      )}
    </div>
  );
}
```

- [ ] **Step 6: 커밋**

```bash
git add client/src/hooks/usePredictions.js client/src/components/
git commit -m "feat: usePredictions hook, VoteButtons, PredictionCard"
```

---

## Task 11: Home + Leaderboard + PredictionDetail 페이지

**Files:**
- Modify: `client/src/pages/Home.jsx`
- Modify: `client/src/pages/Leaderboard.jsx`
- Modify: `client/src/pages/PredictionDetail.jsx`

- [ ] **Step 1: Home 페이지 작성**

`client/src/pages/Home.jsx`:
```jsx
import { Link } from 'react-router-dom';
import { usePredictions } from '../hooks/usePredictions';
import { useAuth } from '../hooks/useAuth';
import PredictionCard from '../components/PredictionCard';
import LineLoginButton from '../components/LineLoginButton';

export default function Home() {
  const { predictions, loading, refetch } = usePredictions();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">🎯 ทายใจ</h1>
          <div className="flex items-center gap-3">
            <Link to="/leaderboard" className="text-sm text-gray-500 hover:text-gray-800">
              อันดับ
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 max-w-[100px] truncate">
                  {user.displayName}
                </span>
                <button
                  onClick={logout}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  ออก
                </button>
              </div>
            ) : (
              <LineLoginButton />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">ยังไม่มีคำทาย</div>
        ) : (
          predictions.map((p) => (
            <PredictionCard key={p.id} prediction={p} onVoted={refetch} />
          ))
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Leaderboard 페이지 작성**

`client/src/pages/Leaderboard.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard')
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-gray-700">←</Link>
          <h1 className="text-xl font-bold text-gray-800">🏆 อันดับ</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">ยังไม่มีข้อมูล</div>
        ) : (
          users.map((u, idx) => (
            <div
              key={u.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
            >
              <span className="text-2xl w-8 text-center">
                {medals[idx] !== undefined ? medals[idx] : idx + 1}
              </span>
              {u.avatar_url && (
                <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{u.display_name}</p>
                <p className="text-xs text-gray-400">
                  {u.correct_predictions}/{u.total_predictions} ครั้ง
                </p>
              </div>
              <span className="text-lg font-bold text-green-600 shrink-0">
                {u.accuracy_pct}%
              </span>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: PredictionDetail 페이지 작성**

`client/src/pages/PredictionDetail.jsx`:
```jsx
import { Link, useParams } from 'react-router-dom';
import { usePrediction } from '../hooks/usePredictions';
import VoteButtons from '../components/VoteButtons';

export default function PredictionDetail() {
  const { id } = useParams();
  const { prediction, loading, refetch } = usePrediction(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">กำลังโหลด...</p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">ไม่พบคำทาย</p>
      </div>
    );
  }

  const total = (prediction.vote_counts || [0, 0]).reduce((a, b) => a + b, 0);
  const deadline = new Date(prediction.deadline);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-gray-700">←</Link>
          <h1 className="text-xl font-bold text-gray-800">คำทาย</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <p className="text-xs text-gray-400 mb-3">
            เฉลยวันที่ {deadline.toLocaleDateString('th-TH')}
          </p>
          <h2 className="text-xl font-bold text-gray-800 mb-6 leading-snug">
            {prediction.question}
          </h2>

          {prediction.resolved ? (
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <p className="font-semibold text-blue-700">
                ✅ เฉลยแล้ว: {prediction.options[prediction.correct_option]}
              </p>
            </div>
          ) : (
            <VoteButtons prediction={prediction} onVoted={refetch} />
          )}

          <p className="text-center text-xs text-gray-400 mt-4">
            โหวตทั้งหมด {total.toLocaleString()} ครั้ง
          </p>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: 브라우저에서 전체 플로우 확인**

백엔드, 프론트엔드 동시 시작:
```bash
# 터미널 1
cd server && node src/index.js

# 터미널 2
cd client && npm run dev
```

확인 체크:
1. `http://localhost:5173` → 예측 카드 목록 표시
2. 카드 클릭 → `/predictions/:id` 상세 페이지
3. `/leaderboard` → 순위판 표시
4. 3초마다 투표 수 자동 갱신 (Network 탭에서 확인)

- [ ] **Step 5: 커밋**

```bash
git add client/src/pages/
git commit -m "feat: home, leaderboard, prediction detail pages"
```

---

## Task 12: 배포 설정

**Files:**
- Create: `server/Procfile`
- Create: `client/vercel.json`

- [ ] **Step 1: Railway Procfile 작성**

`server/Procfile`:
```
web: node src/index.js
```

- [ ] **Step 2: Vercel SPA 라우팅 설정**

`client/vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

- [ ] **Step 3: Railway 배포**

1. `railway.app` → New Project → Deploy from GitHub
2. Root directory: `server`
3. Environment variables 추가:
   - `DATABASE_URL` (Railway PostgreSQL 플러그인 추가 시 자동 설정)
   - `JWT_SECRET` (랜덤 문자열)
   - `LINE_CLIENT_ID`
   - `LINE_CLIENT_SECRET`
   - `LINE_REDIRECT_URI=https://<railway-url>/auth/line/callback`
   - `FRONTEND_URL=https://<vercel-url>`
   - `ADMIN_SECRET` (랜덤 문자열)
4. Railway PostgreSQL 플러그인 추가 → `DATABASE_URL` 자동 설정됨

- [ ] **Step 4: Vercel 배포**

1. `vercel.com` → New Project → Import GitHub
2. Root directory: `client`
3. Environment variables 추가:
   - `VITE_API_URL=https://<railway-url>`
4. Deploy

- [ ] **Step 5: Line Developers Console 설정**

1. `developers.line.biz` → Providers → Create → LINE Login 채널 생성
2. Callback URL: `https://<railway-url>/auth/line/callback`
3. Client ID, Client Secret → Railway 환경변수에 추가 후 재배포

- [ ] **Step 6: 배포 후 전체 플로우 확인**

```bash
# 1. 예측 추가
curl -X POST https://<railway-url>/admin/predictions \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: <ADMIN_SECRET>" \
  -d '{"question":"ดาราคนนี้จะออกละครเดือนหน้าไหม?","options":["ออกแน่นอน","ไม่ออก"],"deadline":"2026-07-01T00:00:00Z"}'

# 2. 예측 목록 확인
curl https://<railway-url>/predictions
```

- [ ] **Step 7: 커밋**

```bash
git add server/Procfile client/vercel.json
git commit -m "chore: railway and vercel deployment config"
```

---

## Phase 2 미리보기 (PromptPay 결제)

Phase 1 완료 후 별도 플랜:
- `promptpay-qr` npm 패키지로 실제 PromptPay QR 생성
- SCB/KBank Webhook으로 실제 입금 확인 후에만 포인트 지급
- `users` 테이블에 `points INT DEFAULT 0` 컬럼 추가
- `transactions` 테이블 추가
- `client/src/pages/TopUp.jsx` 추가
