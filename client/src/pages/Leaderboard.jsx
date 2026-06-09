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
              <span className="text-lg font-bold text-green-600 shrink-0">{u.accuracy_pct}%</span>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
