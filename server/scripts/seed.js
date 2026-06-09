require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../src/db');

const predictions = [
  {
    question: 'ทีมไหนจะคว้าแชมป์ไทยลีกฤดูกาล 2026/27?',
    options: ['บุรีรัมย์ ยูไนเต็ด', 'ชลบุรี เอฟซี'],
    deadline: '2027-05-01T00:00:00Z',
    category: 'sports',
  },
  {
    question: 'ใครจะเป็นนักฟุตบอลไทยที่โอนย้ายไปยุโรปในปี 2026?',
    options: ['ศุภณัฏฐ์ เหมือนตา', 'ธีรศิลป์ แดงดา'],
    deadline: '2026-12-31T00:00:00Z',
    category: 'sports',
  },
  {
    question: 'ทีมชาติไทยจะผ่านเข้ารอบ World Cup 2026 ได้หรือไม่?',
    options: ['ผ่านได้ 🎉', 'ไม่ผ่าน 😢'],
    deadline: '2026-09-01T00:00:00Z',
    category: 'sports',
  },
  {
    question: 'GDP ไทยปี 2026 จะเติบโตเกิน 3% หรือไม่?',
    options: ['เกิน 3% (เศรษฐกิจดี)', 'ไม่ถึง 3% (เศรษฐกิจซบเซา)'],
    deadline: '2027-02-01T00:00:00Z',
    category: 'economy',
  },
  {
    question: 'ค่าเงินบาทสิ้นปี 2026 จะอยู่ที่เท่าไหร่ต่อดอลลาร์?',
    options: ['น้อยกว่า 35 บาท (บาทแข็ง)', 'มากกว่า 35 บาท (บาทอ่อน)'],
    deadline: '2026-12-25T00:00:00Z',
    category: 'economy',
  },
  {
    question: 'หนังไทยเรื่องไหนจะทำรายได้สูงสุดในปี 2026?',
    options: ['หนังผี/สยองขวัญ', 'หนังรักโรแมนติก'],
    deadline: '2026-12-31T00:00:00Z',
    category: 'entertainment',
  },
  {
    question: 'ซีรี่ส์ไทยเรื่องไหนจะดังที่สุดในปี 2026?',
    options: ['วายซีรี่ส์ (Y Series)', 'ซีรี่ส์ดราม่า/ครอบครัว'],
    deadline: '2026-12-31T00:00:00Z',
    category: 'entertainment',
  },
  {
    question: 'รัฐบาลไทยจะอยู่ครบวาระ 4 ปีหรือไม่?',
    options: ['อยู่ครบวาระ', 'ยุบสภาก่อนครบวาระ'],
    deadline: '2027-06-01T00:00:00Z',
    category: 'politics',
  },
];

async function seed() {
  console.log('Running migrations...');
  const { runMigrations } = require('../src/db');
  await runMigrations();

  console.log('Deleting old data...');
  await pool.query('DELETE FROM votes');
  await pool.query('DELETE FROM predictions');

  console.log('Inserting predictions...');
  for (const p of predictions) {
    const { rows } = await pool.query(
      `INSERT INTO predictions (question, options, deadline, category) VALUES ($1, $2, $3, $4) RETURNING id, question`,
      [p.question, p.options, p.deadline, p.category]
    );
    console.log(`  ✓ ${rows[0].question}`);
  }

  console.log(`\nDone! ${predictions.length} predictions added.`);
  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
