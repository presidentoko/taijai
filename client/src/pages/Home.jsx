import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePredictions } from '../hooks/usePredictions';
import { useAuth } from '../hooks/useAuth';
import PredictionCard from '../components/PredictionCard';
import LineLoginButton from '../components/LineLoginButton';

const CATEGORIES = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'sports', label: '⚽ กีฬา' },
  { key: 'politics', label: '🏛️ การเมือง' },
  { key: 'economy', label: '💰 เศรษฐกิจ' },
  { key: 'entertainment', label: '🎬 บันเทิง' },
  { key: 'general', label: '🌐 ทั่วไป' },
];

const isDev = import.meta.env.DEV;
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Home() {
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('new'); // 'new' | 'hot'
  const { predictions, loading, refetch } = usePredictions(category);
  const { user, rankInfo, logout } = useAuth();

  const sorted = [...predictions].sort((a, b) => {
    if (sort === 'hot') {
      const ta = (a.vote_counts || [0, 0]).reduce((x, y) => x + y, 0);
      const tb = (b.vote_counts || [0, 0]).reduce((x, y) => x + y, 0);
      return tb - ta;
    }
    return 0;
  });

  const totalVotes = predictions.reduce((s, p) => s + (p.vote_counts || [0, 0]).reduce((a, b) => a + b, 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">🎯 ทายใจ</h1>
              {totalVotes > 0 && (
                <p className="text-xs text-gray-400">{totalVotes.toLocaleString()} โหวตทั้งหมด</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link to="/leaderboard" className="text-sm text-gray-500 hover:text-gray-800">🏆</Link>
              {user ? (
                <div className="flex items-center gap-2">
                  {rankInfo?.streak > 1 && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                      🔥{rankInfo.streak}
                    </span>
                  )}
                  {rankInfo?.rank && rankInfo.rank <= 100 && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                      #{rankInfo.rank}
                    </span>
                  )}
                  <Link
                    to="/profile"
                    className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-green-600"
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold">
                        {user.displayName?.[0]}
                      </span>
                    )}
                    <span className="max-w-[72px] truncate text-xs">{user.displayName}</span>
                  </Link>
                  <button onClick={logout} className="text-xs text-gray-300 hover:text-red-400">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isDev && (
                    <a
                      href={`${apiUrl}/auth/dev?name=TestUser`}
                      className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg border border-yellow-300"
                    >
                      Dev
                    </a>
                  )}
                  <LineLoginButton />
                </div>
              )}
            </div>
          </div>

          {/* Category + Sort */}
          <div className="flex items-center gap-2 mt-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
                  category === c.key
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                }`}
              >
                {c.label}
              </button>
            ))}
            <div className="shrink-0 ml-auto flex gap-1">
              {['new', 'hot'].map(s => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    sort === s ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {s === 'new' ? '🆕' : '🔥'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🤔</p>
            <p>ยังไม่มีคำทาย</p>
          </div>
        ) : (
          sorted.map((p) => (
            <PredictionCard key={p.id} prediction={p} onVoted={refetch} />
          ))
        )}
      </main>
    </div>
  );
}
