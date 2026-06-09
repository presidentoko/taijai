import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const medals = ['🥇', '🥈', '🥉'];
const PERIODS = [
  { key: '', label: 'ตลอดกาล' },
  { key: 'month', label: 'เดือนนี้' },
  { key: 'week', label: 'สัปดาห์นี้' },
];

function getBadge(u) {
  if (u.streak >= 5) return '🔥';
  if (parseFloat(u.accuracy_pct) >= 70 && u.total_predictions >= 5) return '🎯';
  if (u.total_predictions >= 10) return '⭐';
  return '';
}

export default function Leaderboard() {
  const [period, setPeriod] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const path = period ? `/leaderboard?period=${period}` : '/leaderboard';
    api.get(path).then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-gray-700">←</Link>
          <h1 className="text-xl font-bold text-gray-800">🏆 อันดับนักทำนาย</h1>
        </div>
        <div className="max-w-lg mx-auto px-4 pb-2 flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                period === p.key ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">🏆</p>
            <p>ยังไม่มีอันดับ</p>
            <Link to="/" className="mt-3 inline-block text-sm text-green-600 hover:underline">ไปโหวตก่อน →</Link>
          </div>
        ) : (
          users.map((u, idx) => (
            <div
              key={u.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3 ${
                idx === 0 ? 'border-yellow-300 bg-yellow-50' :
                idx === 1 ? 'border-gray-300' :
                idx === 2 ? 'border-orange-200' : 'border-gray-100'
              }`}
            >
              <span className="text-2xl w-8 text-center shrink-0">
                {medals[idx] ?? idx + 1}
              </span>
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-sm flex items-center justify-center font-bold shrink-0">
                  {u.display_name?.[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-gray-800 truncate">{u.display_name}</p>
                  {getBadge(u) && <span>{getBadge(u)}</span>}
                  {u.streak >= 3 && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">
                      🔥{u.streak}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{u.correct_predictions}/{u.total_predictions} ครั้ง</p>
              </div>
              <span className="text-lg font-bold text-green-600 shrink-0">{u.accuracy_pct}%</span>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
