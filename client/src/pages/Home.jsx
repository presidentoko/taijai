import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePredictions } from '../hooks/usePredictions';
import { useAuth } from '../hooks/useAuth';
import PredictionCard from '../components/PredictionCard';
import LineLoginButton from '../components/LineLoginButton';
import SuggestModal from '../components/SuggestModal';

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
  const [sort, setSort] = useState('new');
  const [showSuggest, setShowSuggest] = useState(false);
  const { predictions, loading, refetch } = usePredictions(category);
  const { user, rankInfo, logout } = useAuth();

  const now = new Date();
  const closingSoon = predictions.filter(p =>
    !p.resolved && new Date(p.deadline) > now &&
    (new Date(p.deadline) - now) < 86400000
  );

  const main = predictions.filter(p => !closingSoon.includes(p));
  const sorted = [...main].sort((a, b) =>
    sort === 'hot'
      ? (b.vote_counts || [0,0]).reduce((x,y)=>x+y,0) - (a.vote_counts || [0,0]).reduce((x,y)=>x+y,0)
      : 0
  );

  const totalVotes = predictions.reduce(
    (s, p) => s + (p.vote_counts || [0, 0]).reduce((a, b) => a + b, 0), 0
  );

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
            <div className="flex items-center gap-2">
              <Link to="/leaderboard" className="text-gray-400 hover:text-gray-700 text-lg">🏆</Link>
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
                  <Link to="/profile" className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold">
                      {user.displayName?.[0]}
                    </div>
                  </Link>
                  <button onClick={logout} className="text-xs text-gray-300 hover:text-red-400">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isDev && (
                    <a href={`${apiUrl}/auth/dev?name=TestUser`}
                      className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg border border-yellow-300">
                      Dev
                    </a>
                  )}
                  <LineLoginButton />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar pb-1">
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
            <div className="shrink-0 flex gap-1 ml-auto">
              {['new', 'hot'].map(s => (
                <button key={s} onClick={() => setSort(s)}
                  className={`text-xs px-2 py-1 rounded-lg ${sort === s ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>
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
        ) : (
          <>
            {/* Closing soon */}
            {closingSoon.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-red-500">⚡ ปิดรับโหวตเร็วๆ นี้</span>
                  <span className="text-xs text-gray-400">ด่วน!</span>
                </div>
                <div className="space-y-3">
                  {closingSoon.map(p => (
                    <PredictionCard key={p.id} prediction={p} onVoted={refetch} urgent />
                  ))}
                </div>
                {sorted.length > 0 && <div className="border-t border-gray-200 my-4" />}
              </div>
            )}

            {sorted.length === 0 && closingSoon.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🤔</p>
                <p>ยังไม่มีคำทาย</p>
              </div>
            ) : (
              sorted.map(p => <PredictionCard key={p.id} prediction={p} onVoted={refetch} />)
            )}
          </>
        )}

        {/* Suggest button */}
        {user && (
          <button
            onClick={() => setShowSuggest(true)}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-500 text-sm transition-colors"
          >
            + เสนอคำทายใหม่
          </button>
        )}
      </main>

      {showSuggest && <SuggestModal onClose={() => setShowSuggest(false)} />}
    </div>
  );
}
