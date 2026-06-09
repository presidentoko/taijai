import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';

export default function VoteButtons({ prediction, onVoted }) {
  const { user } = useAuth();
  const [voted, setVoted] = useState(false);
  const [myOption, setMyOption] = useState(null);
  const [optimisticCounts, setOptimisticCounts] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const counts = optimisticCounts || prediction.vote_counts || [0, 0];
  const total = counts[0] + counts[1];
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  async function handleVote(optionIndex) {
    if (!user) {
      window.location.href = `${apiUrl}/auth/line`;
      return;
    }
    if (voted || submitting) return;

    const newCounts = [counts[0], counts[1]];
    newCounts[optionIndex] += 1;
    setOptimisticCounts(newCounts);
    setMyOption(optionIndex);
    setVoted(true);
    setSubmitting(true);

    try {
      await api.post('/votes', { predictionId: prediction.id, optionIndex });
      onVoted?.();
    } catch (e) {
      if (e.status === 409) {
        setVoted(true);
      } else {
        setOptimisticCounts(null);
        setMyOption(null);
        setVoted(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!voted) {
    return (
      <div className="space-y-2">
        {prediction.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleVote(idx)}
            className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white py-3 rounded-xl font-semibold text-base transition-colors"
          >
            {option}
          </button>
        ))}
        {!user && (
          <p className="text-center text-xs text-gray-400 mt-1">
            ต้องเข้าสู่ระบบด้วย LINE ก่อนโหวต
          </p>
        )}
      </div>
    );
  }

  const myPct = total > 0 ? Math.round((counts[myOption] / total) * 100) : 0;
  const sameCount = counts[myOption];

  return (
    <div className="space-y-2">
      {prediction.options.map((option, idx) => {
        const pct = total > 0 ? Math.round((counts[idx] / total) * 100) : 0;
        const isMyChoice = idx === myOption;
        return (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span className={`font-medium ${isMyChoice ? 'text-green-700' : 'text-gray-600'}`}>
                {isMyChoice ? '✓ ' : ''}{option}
              </span>
              <span className={`font-bold ${isMyChoice ? 'text-green-600' : 'text-gray-500'}`}>{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-700 ${isMyChoice ? 'bg-green-500' : 'bg-gray-300'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{counts[idx].toLocaleString()} คน</p>
          </div>
        );
      })}
      <div className="mt-3 p-3 bg-green-50 rounded-xl text-center">
        <p className="text-sm font-semibold text-green-700">✅ โหวตแล้ว!</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {sameCount.toLocaleString()} คน ({myPct}%) เลือกเหมือนคุณ
          {myPct < 40 ? ' 🔥 คุณกล้ามาก!' : myPct > 70 ? ' 👍 เป็นฝ่ายส่วนใหญ่' : ''}
        </p>
      </div>
    </div>
  );
}
