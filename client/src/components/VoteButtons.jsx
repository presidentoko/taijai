import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useWeeklyStatus } from '../hooks/useWeeklyStatus';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function VoteButtons({ prediction, onVoted }) {
  const { user } = useAuth();
  const weeklyStatus = useWeeklyStatus();

  const voteKey = `voted_${prediction.id}`;
  const savedVote = localStorage.getItem(voteKey);

  const [voted, setVoted] = useState(savedVote !== null);
  const [myOption, setMyOption] = useState(savedVote !== null ? parseInt(savedVote) : null);
  const [optimisticCounts, setOptimisticCounts] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const counts = optimisticCounts || prediction.vote_counts || [0, 0];
  const total = counts[0] + counts[1];

  const freeLeft = weeklyStatus ? weeklyStatus.remaining : null;
  const isFree = freeLeft === null || freeLeft > 0;
  const creditCost = weeklyStatus?.creditCost || 50;
  const userCredits = weeklyStatus?.credits;

  async function handleVote(optionIndex) {
    if (!user) {
      window.location.href = `${apiUrl}/auth/line`;
      return;
    }
    if (voted || submitting) return;
    setError(null);
    navigator.vibrate?.(8);

    const newCounts = [counts[0], counts[1]];
    newCounts[optionIndex] += 1;
    setOptimisticCounts(newCounts);
    setMyOption(optionIndex);
    setVoted(true);
    setSubmitting(true);

    try {
      await api.post('/votes', { predictionId: prediction.id, optionIndex });
      localStorage.setItem(voteKey, optionIndex.toString());
      onVoted?.();
    } catch (e) {
      if (e.status === 409) {
        localStorage.setItem(voteKey, optionIndex.toString());
      } else if (e.status === 402) {
        setOptimisticCounts(null);
        setMyOption(null);
        setVoted(false);
        setError('insufficient_credits');
      } else {
        setOptimisticCounts(null);
        setMyOption(null);
        setVoted(false);
        setError('error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (error === 'insufficient_credits') {
    return (
      <div className="p-4 bg-yellow-50 rounded-xl text-center border border-yellow-200">
        <p className="text-sm font-semibold text-yellow-700 mb-1">💎 เครดิตไม่พอ</p>
        <p className="text-xs text-gray-500 mb-3">
          ใช้ฟรีครบ 5 ครั้ง/สัปดาห์แล้ว — โหวตต่อต้องใช้ {creditCost} เครดิต/ครั้ง
        </p>
        <Link
          to="/credits"
          className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          เติมเครดิต →
        </Link>
      </div>
    );
  }

  if (!voted) {
    return (
      <div className="space-y-2">
        {!isFree && (
          <div className="flex items-center justify-between text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg">
            <span>💎 ใช้ {creditCost} เครดิต/โหวต</span>
            <span>{userCredits ?? '...'} เครดิตคงเหลือ</span>
          </div>
        )}
        {prediction.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleVote(idx)}
            disabled={submitting}
            className="w-full bg-green-500 hover:bg-green-600 active:scale-[0.98] active:bg-green-700 text-white py-3.5 rounded-xl font-semibold text-base transition-all disabled:opacity-60 touch-manipulation"
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
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
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
          {myPct < 30 ? ' 🔥 คุณกล้ามาก!' : myPct < 45 ? ' 💪 ฝ่ายน้อย' : myPct > 70 ? ' 👍 เป็นฝ่ายส่วนใหญ่' : ''}
        </p>
      </div>
    </div>
  );
}
