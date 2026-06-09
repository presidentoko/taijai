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
                <button onClick={logout} className="text-xs text-red-400 hover:text-red-600">
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
