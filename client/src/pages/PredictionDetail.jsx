import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import confetti from 'canvas-confetti';
import { usePrediction } from '../hooks/usePredictions';
import { useAuth } from '../hooks/useAuth';
import VoteButtons from '../components/VoteButtons';
import Comments from '../components/Comments';
import ShareButton from '../components/ShareButton';
import Countdown from '../components/Countdown';

const siteUrl = import.meta.env.VITE_SITE_URL || 'https://taijai.vercel.app';

export default function PredictionDetail() {
  const { id } = useParams();
  const { prediction, loading, refetch } = usePrediction(id);
  const { user, rankInfo } = useAuth();
  const confettiFired = useRef(false);

  useEffect(() => {
    if (!prediction?.resolved || confettiFired.current) return;
    // Find if user voted correctly
    const userVoteKey = `voted_${id}`;
    const myVote = localStorage.getItem(userVoteKey);
    if (myVote !== null && parseInt(myVote) === prediction.correct_option) {
      confettiFired.current = true;
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [prediction?.resolved]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">กำลังโหลด...</p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">ไม่พบคำทาย</p>
      </div>
    );
  }

  const total = (prediction.vote_counts || [0, 0]).reduce((a, b) => a + b, 0);
  const deadline = new Date(prediction.deadline);
  const isExpired = deadline < new Date();
  const ogTitle = `🎯 ${prediction.question}`;
  const ogDesc = `${total.toLocaleString()} คนร่วมทาย • ${prediction.options[0]} vs ${prediction.options[1]}`;

  return (
    <>
      <Helmet>
        <title>{prediction.question} — ทายใจ</title>
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDesc} />
        <meta property="og:url" content={`${siteUrl}/predictions/${id}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-gray-700">←</Link>
            <h1 className="text-lg font-bold text-gray-800 truncate">ทายใจ</h1>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">
                {prediction.category !== 'general' ? prediction.category : ''}
              </span>
              {!isExpired && !prediction.resolved
                ? <Countdown deadline={prediction.deadline} />
                : null
              }
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-6 leading-snug">
              {prediction.question}
            </h2>

            {prediction.resolved ? (
              <div className="p-4 bg-blue-50 rounded-xl text-center mb-4">
                <p className="font-semibold text-blue-700 text-lg">
                  ✅ เฉลยแล้ว: {prediction.options[prediction.correct_option]}
                </p>
              </div>
            ) : isExpired ? (
              <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-400 mb-4">
                หมดเวลาโหวต — รอเฉลย
              </div>
            ) : (
              <VoteButtons prediction={prediction} onVoted={refetch} />
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">{total.toLocaleString()} คนร่วมทาย</p>
              <ShareButton
                prediction={prediction}
                userAccuracy={rankInfo?.accuracy_pct}
                userRank={rankInfo?.rank}
              />
            </div>

            <Comments predictionId={id} />
          </div>
        </main>
      </div>
    </>
  );
}
