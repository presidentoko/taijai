import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';

const BADGES = [
  {
    id: 'legend',
    icon: '👑',
    label: 'ตำนาน',
    color: 'bg-yellow-100 text-yellow-700',
    check: u => u.streak >= 10,
  },
  {
    id: 'fire',
    icon: '🔥',
    label: 'ขั้นเทพ',
    color: 'bg-orange-100 text-orange-600',
    check: u => u.streak >= 5 && u.streak < 10,
  },
  {
    id: 'sharpshooter',
    icon: '🎯',
    label: 'นักทำนาย',
    color: 'bg-purple-100 text-purple-600',
    check: u => parseFloat(u.accuracy_pct) >= 70 && u.total_predictions >= 5,
  },
  {
    id: 'expert',
    icon: '⭐',
    label: 'ผู้เชี่ยวชาญ',
    color: 'bg-blue-100 text-blue-600',
    check: u => u.total_predictions >= 20,
  },
  {
    id: 'active',
    icon: '💪',
    label: 'นักโหวต',
    color: 'bg-indigo-100 text-indigo-600',
    check: u => u.total_predictions >= 10 && u.total_predictions < 20,
  },
  {
    id: 'newbie',
    icon: '🌱',
    label: 'มือใหม่',
    color: 'bg-gray-100 text-gray-500',
    check: u => u.total_predictions > 0 && u.total_predictions < 10,
  },
];

function getEarnedBadges(profile) {
  return BADGES.filter(b => b.check(profile));
}

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

  const badges = profile ? getEarnedBadges(profile) : [];
  const primaryBadge = badges[0];

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
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 text-2xl flex items-center justify-center font-bold">
                {user.displayName?.[0]}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-lg font-bold text-gray-800">{user.displayName}</p>
                {primaryBadge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${primaryBadge.color}`}>
                    {primaryBadge.icon} {primaryBadge.label}
                  </span>
                )}
              </div>
              {!loading && profile?.rank && profile.total_predictions > 0 && (
                <p className="text-sm text-gray-500">
                  อันดับที่ <span className="font-bold text-yellow-600">#{profile.rank}</span>
                </p>
              )}
            </div>
          </div>

          {!loading && profile && (
            <>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">{profile.total_predictions}</p>
                  <p className="text-xs text-gray-400">ทาย</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-green-600">{profile.accuracy_pct}%</p>
                  <p className="text-xs text-gray-400">แม่นยำ</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-orange-500">🔥{profile.streak}</p>
                  <p className="text-xs text-gray-400">สตรีค</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-blue-600">{profile.credits || 0}</p>
                  <p className="text-xs text-gray-400">เครดิต</p>
                </div>
              </div>

              {profile.max_streak > 1 && (
                <div className="bg-orange-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">สถิติสูงสุด</span>
                  <span className="font-bold text-orange-500">🔥 {profile.max_streak} วัน</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Badges */}
        {!loading && badges.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">ตราสัญลักษณ์</h3>
            <div className="flex flex-wrap gap-2">
              {badges.map(b => (
                <span key={b.id} className={`text-xs px-3 py-1.5 rounded-full font-semibold ${b.color}`}>
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Locked badges teaser */}
        {!loading && profile && badges.length < BADGES.length && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">ปลดล็อคต่อไป</h3>
            <div className="flex flex-wrap gap-2">
              {BADGES.filter(b => !b.check(profile)).map(b => (
                <span key={b.id} className="text-xs px-3 py-1.5 rounded-full font-semibold bg-gray-100 text-gray-400 opacity-50">
                  🔒 {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Credits */}
        <Link
          to="/credits"
          className="block bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 shadow-sm text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">💎 เติมเครดิต</p>
              <p className="text-sm text-green-100">เริ่มต้น ฿20 • รับ 100 เครดิต</p>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </Link>

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
          profile.votes.map((v, i) => {
            const isCorrect = v.resolved && v.option_index === v.correct_option;
            const isWrong = v.resolved && v.option_index !== v.correct_option;
            return (
              <Link
                key={i}
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
          className="w-full py-3 rounded-2xl border border-red-200 text-red-400 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          ออกจากระบบ
        </button>
      </main>
    </div>
  );
}
