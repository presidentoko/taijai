import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePredictions } from '../hooks/usePredictions';
import { useAuth } from '../hooks/useAuth';
import { useWeeklyStatus } from '../hooks/useWeeklyStatus';
import PredictionCard from '../components/PredictionCard';
import LineLoginButton from '../components/LineLoginButton';
import SuggestModal from '../components/SuggestModal';
import SkeletonCard from '../components/SkeletonCard';

const CATEGORIES = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'sports', label: '⚽ กีฬา' },
  { key: 'politics', label: '🏛️ การเมือง' },
  { key: 'economy', label: '💰 เศรษฐกิจ' },
  { key: 'entertainment', label: '🎬 บันเทิง' },
  { key: 'general', label: '🌐 ทั่วไป' },
];

const PAGE_SIZE = 10;
const isDev = import.meta.env.DEV;
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Home() {
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('new');
  const [search, setSearch] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { predictions, loading, refetch } = usePredictions(category);
  const { user, rankInfo, logout } = useAuth();
  const weeklyStatus = useWeeklyStatus();

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category, sort, search]);

  const now = new Date();

  const filtered = useMemo(() => {
    if (!search.trim()) return predictions;
    const q = search.toLowerCase();
    return predictions.filter(p =>
      p.question.toLowerCase().includes(q) ||
      (p.options || []).some(o => o.toLowerCase().includes(q))
    );
  }, [predictions, search]);

  const closingSoon = filtered.filter(p =>
    !p.resolved && new Date(p.deadline) > now &&
    (new Date(p.deadline) - now) < 86400000
  );

  const main = filtered.filter(p => !closingSoon.includes(p));
  const sorted = [...main].sort((a, b) =>
    sort === 'hot'
      ? (b.vote_counts || [0, 0]).reduce((x, y) => x + y, 0) - (a.vote_counts || [0, 0]).reduce((x, y) => x + y, 0)
      : 0
  );

  const visible = sorted.slice(0, visibleCount);
  const hasMore = sorted.length > visibleCount;

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

          {/* Search */}
          <div className="mt-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาคำทาย..."
              className="w-full pl-8 pr-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
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
        {/* Weekly status banner */}
        {user && weeklyStatus && (
          <Link to="/leaderboard?period=week" className="block">
            <div className={`rounded-2xl p-3 flex items-center justify-between ${
              weeklyStatus.remaining > 0
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{weeklyStatus.remaining > 0 ? '🎯' : '💎'}</span>
                <div>
                  <p className={`text-xs font-semibold ${weeklyStatus.remaining > 0 ? 'text-green-700' : 'text-yellow-700'}`}>
                    {weeklyStatus.remaining > 0
                      ? `โหวตฟรีเหลือ ${weeklyStatus.remaining}/${weeklyStatus.free} ครั้ง`
                      : `ฟรีหมดแล้ว — ใช้ ${weeklyStatus.creditCost} เครดิต/ครั้ง`
                    }
                  </p>
                  <p className="text-xs text-gray-400">ดูอันดับสัปดาห์นี้ →</p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: weeklyStatus.free }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${
                    i < (weeklyStatus.free - weeklyStatus.remaining)
                      ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                ))}
              </div>
            </div>
          </Link>
        )}

        {loading ? (
          [1, 2, 3].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            {/* Search results info */}
            {search && (
              <p className="text-xs text-gray-400 px-1">
                พบ {filtered.length} รายการ {filtered.length === 0 ? '— ลองค้นคำอื่น' : ''}
              </p>
            )}

            {/* Closing soon */}
            {closingSoon.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-red-500 animate-pulse">⚡ ปิดรับโหวตเร็วๆ นี้</span>
                  <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-semibold">ด่วน!</span>
                </div>
                <div className="space-y-3">
                  {closingSoon.map(p => (
                    <PredictionCard key={p.id} prediction={p} onVoted={refetch} urgent />
                  ))}
                </div>
                {sorted.length > 0 && <div className="border-t border-gray-200 my-4" />}
              </div>
            )}

            {visible.length === 0 && closingSoon.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">{search ? '🔍' : '🤔'}</p>
                <p>{search ? 'ไม่พบคำทายที่ค้นหา' : 'ยังไม่มีคำทาย'}</p>
              </div>
            ) : (
              <>
                {visible.map(p => <PredictionCard key={p.id} prediction={p} onVoted={refetch} />)}

                {hasMore && (
                  <button
                    onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                    className="w-full py-3 rounded-2xl border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 text-sm font-medium transition-colors bg-white"
                  >
                    ดูเพิ่มอีก {Math.min(PAGE_SIZE, sorted.length - visibleCount)} รายการ ↓
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* Suggest button */}
        {user && !search && (
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
