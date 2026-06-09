import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';

export default function VoteButtons({ prediction, onVoted }) {
  const { user } = useAuth();
  const [voted, setVoted] = useState(false);
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
            className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white py-3 rounded-xl font-semibold text-lg transition-colors"
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

  return (
    <div className="space-y-2">
      {prediction.options.map((option, idx) => {
        const pct = total > 0 ? Math.round((counts[idx] / total) * 100) : 0;
        return (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{option}</span>
              <span className="font-bold">{pct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5">
              <div
                className="bg-green-500 h-5 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{counts[idx].toLocaleString()} คน</p>
          </div>
        );
      })}
      <p className="text-center text-sm text-green-600 font-medium mt-2">✅ โหวตแล้ว!</p>
    </div>
  );
}
