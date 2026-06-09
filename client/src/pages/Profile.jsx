import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    api.get('/users/me')
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-gray-700">←</Link>
          <h1 className="text-xl font-bold text-gray-800">โปรไฟล์</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* User card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 text-2xl flex items-center justify-center font-bold">
              {user.displayName?.[0]}
            </div>
          )}
          <div className="flex-1">
            <p className="text-lg font-bold text-gray-800">{user.displayName}</p>
            {loading ? (
              <p className="text-sm text-gray-400">กำลังโหลด...</p>
            ) : (
              <p className="text-sm text-gray-500">
                ทาย {profile?.total_predictions || 0} ครั้ง · ถูก {profile?.correct_predictions || 0} ครั้ง
              </p>
            )}
          </div>
          {!loading && profile?.total_predictions > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{profile.accuracy_pct}%</p>
              <p className="text-xs text-gray-400">แม่นยำ</p>
            </div>
          )}
        </div>

        {/* Vote history */}
        <h2 className="text-sm font-semibold text-gray-500 px-1">ประวัติการโหวต</h2>

        {loading ? (
          <div className="text-center py-8 text-gray-400">กำลังโหลด...</div>
        ) : !profile?.votes?.length ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">🗳️</p>
            <p>ยังไม่เคยโหวต</p>
            <Link to="/" className="mt-3 inline-block text-sm text-green-600 hover:underline">
              ไปโหวตกัน →
            </Link>
          </div>
        ) : (
          profile.votes.map((v) => {
            const isCorrect = v.resolved && v.option_index === v.correct_option;
            const isWrong = v.resolved && v.option_index !== v.correct_option;
            return (
              <Link
                key={v.prediction_id}
                to={`/predictions/${v.prediction_id}`}
                className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-200 transition-colors"
              >
                <p className="text-sm font-medium text-gray-800 mb-1 leading-snug">{v.question}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    เลือก: <span className="font-medium text-gray-700">{v.options[v.option_index]}</span>
                  </span>
                  {isCorrect && <span className="text-xs text-green-600 font-semibold">✅ ถูก</span>}
                  {isWrong && <span className="text-xs text-red-500 font-semibold">❌ ผิด</span>}
                  {!v.resolved && <span className="text-xs text-yellow-600 font-semibold">⏳ รอเฉลย</span>}
                </div>
              </Link>
            );
          })
        )}

        <button
          onClick={() => { logout(); navigate('/'); }}
          className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors mt-4"
        >
          ออกจากระบบ
        </button>
      </main>
    </div>
  );
}
