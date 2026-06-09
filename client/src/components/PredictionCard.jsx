import { Link } from 'react-router-dom';
import VoteButtons from './VoteButtons';
import Countdown from './Countdown';
import ShareButton from './ShareButton';

const CATEGORY_LABELS = {
  sports: '⚽ กีฬา',
  politics: '🏛️ การเมือง',
  economy: '💰 เศรษฐกิจ',
  entertainment: '🎬 บันเทิง',
  general: '🌐 ทั่วไป',
};

function getViewers(prediction) {
  const total = (prediction.vote_counts || [0, 0]).reduce((a, b) => a + b, 0);
  const idNum = prediction.id
    ? parseInt(prediction.id.replace(/-/g, '').slice(0, 8), 16) % 1000
    : 0;
  return Math.max(3, (idNum % 20) + Math.floor(total * 0.15) + 4);
}

export default function PredictionCard({ prediction, onVoted, urgent }) {
  const deadline = new Date(prediction.deadline);
  const created = new Date(prediction.created_at);
  const now = new Date();
  const isExpired = deadline < now;
  const isNew = !prediction.resolved && (now - created) < 86400000;
  const total = (prediction.vote_counts || [0, 0]).reduce((a, b) => a + b, 0);
  const viewers = getViewers(prediction);

  return (
    <div className={`bg-white rounded-2xl shadow-sm p-5 border transition-all ${
      urgent ? 'border-red-200 ring-1 ring-red-200' : 'border-gray-100'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {prediction.category && prediction.category !== 'general' && (
            <span className="text-xs text-gray-400">
              {CATEGORY_LABELS[prediction.category] || prediction.category}
            </span>
          )}
          {isNew && !prediction.resolved && (
            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">
              ✨ ใหม่
            </span>
          )}
          {urgent && (
            <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-semibold animate-pulse">
              🔥 Hot
            </span>
          )}
        </div>
        {!isExpired && !prediction.resolved
          ? <Countdown deadline={prediction.deadline} />
          : <span className="text-xs text-gray-400">{isExpired && !prediction.resolved ? '⏰ หมดเวลา' : ''}</span>
        }
      </div>

      <Link to={`/predictions/${prediction.id}`}>
        <h2 className="text-base font-bold text-gray-800 mb-4 leading-snug hover:text-green-600 transition-colors">
          {prediction.question}
        </h2>
      </Link>

      {prediction.resolved ? (
        <div className="p-3 bg-blue-50 rounded-xl text-center">
          <p className="text-sm font-semibold text-blue-700">
            ✅ เฉลยแล้ว: {prediction.options[prediction.correct_option]}
          </p>
        </div>
      ) : isExpired ? (
        <div className="p-3 bg-gray-50 rounded-xl text-center text-gray-400 text-sm">
          หมดเวลาโหวต — รอเฉลย
        </div>
      ) : (
        <VoteButtons prediction={prediction} onVoted={onVoted} />
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {total > 0 && <span>{total.toLocaleString()} คนร่วมทาย</span>}
          {!prediction.resolved && !isExpired && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              {viewers} คนดูอยู่
            </span>
          )}
          {prediction.comment_count > 0 && (
            <span>💬 {prediction.comment_count}</span>
          )}
        </div>
        <ShareButton prediction={prediction} />
      </div>
    </div>
  );
}
