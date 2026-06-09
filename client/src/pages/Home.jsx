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
  const { predictions, loading, refetch } = usePredictions(category);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">🎯 ทายใจ</h1>
          <div className="flex items-center gap-3">
            <Link to="/leaderboard" className="text-sm text-gray-500 hover:text-gray-800">
              🏆 อันดับ
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-green-600"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold">
                      {user.displayName?.[0]}
                    </span>
                  )}
                  <span className="max-w-[80px] truncate">{user.displayName}</span>
                </Link>
                <button onClick={logout} className="text-xs text-red-400 hover:text-red-600">
                  ออก
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isDev && (
                  <a
                    href={`${apiUrl}/auth/dev?name=TestUser`}
                    className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg border border-yellow-300 hover:bg-yellow-200"
                  >
                    Dev Login
                  </a>
                )}
                <LineLoginButton />
              </div>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div className="max-w-lg mx-auto px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
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
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🤔</p>
            <p>ยังไม่มีคำทาย</p>
          </div>
        ) : (
          predictions.map((p) => (
            <PredictionCard key={p.id} prediction={p} onVoted={refetch} />
          ))
        )}
      </main>
    </div>
  );
}
