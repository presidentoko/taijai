import { Link } from 'react-router-dom';
import VoteButtons from './VoteButtons';

const CATEGORY_LABELS = {
  sports: '⚽ กีฬา',
  politics: '🏛️ การเมือง',
  economy: '💰 เศรษฐกิจ',
  entertainment: '🎬 บันเทิง',
  general: '🌐 ทั่วไป',
};

export default function PredictionCard({ prediction, onVoted }) {
  const deadline = new Date(prediction.deadline);
  const isExpired = deadline < new Date();
  const total = (prediction.vote_counts || [0, 0]).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        {prediction.category && prediction.category !== 'general' ? (
          <span className="text-xs text-gray-400">{CATEGORY_LABELS[prediction.category] || prediction.category}</span>
        ) : (
          <span />
        )}
        <span className="text-xs text-gray-400">
          {isExpired ? '⏰ หมดเวลา' : `เฉลย ${deadline.toLocaleDateString('th-TH')}`}
        </span>
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
      {total > 0 && (
        <p className="text-xs text-gray-400 text-right mt-2">{total.toLocaleString()} โหวต</p>
      )}
    </div>
  );
}
