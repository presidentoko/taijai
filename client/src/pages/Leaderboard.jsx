import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';

const medals = ['🥇', '🥈', '🥉'];
const PERIODS = [
  { key: '', label: 'ตลอดกาล' },
  { key: 'month', label: 'เดือนนี้' },
  { key: 'week', label: 'สัปดาห์นี้' },
];

function getBadge(u) {
  if (u.streak >= 10) return '👑';
  if (u.streak >= 5) return '🔥';
  if (parseFloat(u.accuracy_pct) >= 70 && u.total_predictions >= 5) return '🎯';
  if (u.total_predictions >= 20) return '⭐';
  return '';
}

function AccuracyBar({ pct }) {
  return (
    <div className="w-16 bg-gray-100 rounded-full h-1.5 mt-1">
      <div
        className="h-1.5 rounded-full bg-green-400"
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

export default function Leaderboard() {
  const [period, setPeriod] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: me } = useAuth();

  useEffect(() => {
    setLoading(true);
    const path = period ? `/leaderboard?period=${period}` : '/leaderboard';
    api.get(path).then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, [period]);

  const myRank = me ? users.findIndex(u => u.display_name === me.displayName) : -1;

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
        {/* My rank banner */}
        {me && myRank >= 3 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center justify-between">
            <span className="text-sm text-green-700">อันดับของคุณ</span>
            <span className="font-bold text-green-600">#{myRank + 1}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="skeleton w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-32" />
                    <div className="skeleton h-2 w-20" />
                  </div>
                  <div className="skeleton h-5 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">🏆</p>
            <p>ยังไม่มีอันดับ</p>
            <Link to="/" className="mt-3 inline-block text-sm text-green-600 hover:underline">ไปโหวตก่อน →</Link>
          </div>
        ) : (
          users.map((u, idx) => {
            const isMe = me && u.display_name === me.displayName;
            return (
              <div
                key={u.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3 transition-all ${
                  isMe ? 'border-green-300 ring-1 ring-green-200' :
                  idx === 0 ? 'border-yellow-300 bg-yellow-50' :
                  idx === 1 ? 'border-gray-300' :
                  idx === 2 ? 'border-orange-200' : 'border-gray-100'
                }`}
              >
                <span className="text-2xl w-8 text-center shrink-0 font-bold">
                  {medals[idx] ?? <span className="text-sm text-gray-400">{idx + 1}</span>}
                </span>
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full shrink-0 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-sm flex items-center justify-center font-bold shrink-0">
                    {u.display_name?.[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`font-semibold truncate ${isMe ? 'text-green-700' : 'text-gray-800'}`}>
                      {u.display_name} {isMe && '(คุณ)'}
                    </p>
                    {getBadge(u) && <span className="text-sm">{getBadge(u)}</span>}
                    {u.streak >= 3 && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-semibold">
                        🔥{u.streak}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{u.correct_predictions}/{u.total_predictions} ครั้ง</p>
                  <AccuracyBar pct={parseFloat(u.accuracy_pct)} />
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-bold text-green-600">{u.accuracy_pct}%</span>
                  <p className="text-xs text-gray-400">แม่นยำ</p>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
