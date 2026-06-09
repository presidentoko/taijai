# 예측 앱 디자인 스펙

**날짜:** 2026-06-09
**단계:** Phase 1 (투표 앱) → Phase 2 (PromptPay 결제)

---

## 개요

태국 유저 대상 예측/투표 웹앱. 유저가 "이 일이 일어날까?" 질문에 투표하고, 정확도 기반 순위판에 올라가는 앱. Phase 1은 결제 없이 투표/순위판만. Phase 2에서 PromptPay webhook 결제 추가.

---

## 스택

| 레이어 | 기술 | 배포 |
|--------|------|------|
| Frontend | React + Vite + TailwindCSS | Vercel |
| Backend | Express.js (Node.js) | Railway |
| Database | PostgreSQL | Railway |
| Auth | Line OAuth 2.0 + JWT | - |

---

## API 엔드포인트

```
GET  /predictions             예측 목록 (최신순)
GET  /predictions/:id         예측 상세 + 투표 현황
POST /predictions/:id/vote    투표 (로그인 필요)
GET  /leaderboard             순위판 (정확도 순)
GET  /auth/line               Line 로그인 시작
GET  /auth/line/callback      Line OAuth 콜백
```

비로그인 유저: GET 가능, POST 불가 (401).

---

## DB 스키마

```sql
predictions
  id             UUID PRIMARY KEY
  question       TEXT NOT NULL
  options        TEXT[]
  deadline       TIMESTAMPTZ NOT NULL
  resolved       BOOLEAN DEFAULT FALSE
  correct_option INT                     -- 정답 공개 후 0 or 1
  created_at     TIMESTAMPTZ DEFAULT NOW()

users
  id                  UUID PRIMARY KEY
  line_id             TEXT UNIQUE NOT NULL
  display_name        TEXT
  avatar_url          TEXT
  total_predictions   INT DEFAULT 0
  correct_predictions INT DEFAULT 0
  created_at          TIMESTAMPTZ DEFAULT NOW()

votes
  id            UUID PRIMARY KEY
  prediction_id UUID REFERENCES predictions(id)
  user_id       UUID REFERENCES users(id)
  option_index  INT NOT NULL
  created_at    TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(prediction_id, user_id)          -- 중복 투표 DB 레벨 차단
```

---

## Line 로그인 플로우

1. 유저 → "Line으로 로그인" 클릭
2. 프론트 → `GET /auth/line` → Line OAuth 페이지 리다이렉트
3. 유저 Line에서 허가
4. Line → `GET /auth/line/callback?code=xxx`
5. 서버 → code로 Line API에서 프로필 조회
6. users 테이블 upsert
7. JWT 발급 (7일 유효)
8. 프론트로 리다이렉트 (토큰 쿼리스트링)
9. 프론트 → localStorage에 토큰 저장
10. 이후 API 요청: `Authorization: Bearer <token>`

---

## 프론트엔드 구조

```
src/
├── pages/
│   ├── Home.jsx              카드 목록 (스크롤)
│   ├── PredictionDetail.jsx  투표 + 결과
│   └── Leaderboard.jsx       순위판
├── components/
│   ├── PredictionCard.jsx    카드 (질문, 마감일, 투표 수)
│   ├── VoteButtons.jsx       투표 전: A/B 버튼 / 투표 후: 퍼센트 바
│   ├── Leaderboard.jsx       순위 리스트
│   └── LineLoginButton.jsx   로그인 버튼 (우상단 고정)
├── hooks/
│   ├── useAuth.js            Line 로그인 상태
│   └── usePredictions.js     예측 데이터 + 3초 폴링
└── api.js                    fetch 래퍼 (Authorization 헤더 자동)
```

---

## UX 규칙

- 비로그인도 결과 볼 수 있음 (투표만 로그인 필요)
- 투표 후 즉시 퍼센트 바로 전환 (낙관적 업데이트)
- 3초마다 투표 수 자동 갱신 (폴링)
- 모바일 우선 레이아웃 (세로 스크롤 카드)
- UI 언어: 태국어

---

## Phase 2 (결제) — 별도 스펙

- PromptPay QR 생성 (`promptpay-qr` 패키지)
- PromptPay webhook 으로 실제 입금 확인 후 포인트 지급
- 포인트 시스템 (top-up 50/100/300 바트)
- transactions 테이블 추가

---

## 보안 결정 사항

- 중복 투표: DB UNIQUE 제약으로 차단 (클라이언트 체크는 보조)
- 포인트 지급: webhook 서버사이드 검증 후만 지급 (Phase 2)
- Firebase 없음: 모든 데이터는 PostgreSQL (쿼리 제어 가능)
