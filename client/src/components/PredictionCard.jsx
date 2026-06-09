import { Link } from 'react-router-dom';
import VoteButtons from './VoteButtons';

export default function PredictionCard({ prediction, onVoted }) {
  const deadline = new Date(prediction.deadline);
  const isExpired = deadline < new Date();

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
      <p className="text-xs text-gray-400 mb-2">
        {isExpired ? '⏰ หมดเวลา' : `⏰ เฉลยวันที่ ${deadline.toLocaleDateString('th-TH')}`}
      </p>
      <Link to={`/predictions/${prediction.id}`}>
        <h2 className="text-lg font-bold text-gray-800 mb-4 leading-snug hover:text-green-600 transition-colors">
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
    </div>
  );
}
