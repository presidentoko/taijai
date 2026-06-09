import { Link, useParams } from 'react-router-dom';
import { usePrediction } from '../hooks/usePredictions';
import VoteButtons from '../components/VoteButtons';

export default function PredictionDetail() {
  const { id } = useParams();
  const { prediction, loading, refetch } = usePrediction(id);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-gray-700">←</Link>
          <h1 className="text-xl font-bold text-gray-800">คำทาย</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <p className="text-xs text-gray-400 mb-3">
            เฉลยวันที่ {deadline.toLocaleDateString('th-TH')}
          </p>
          <h2 className="text-xl font-bold text-gray-800 mb-6 leading-snug">
            {prediction.question}
          </h2>
          {prediction.resolved ? (
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <p className="font-semibold text-blue-700">
                ✅ เฉลยแล้ว: {prediction.options[prediction.correct_option]}
              </p>
            </div>
          ) : (
            <VoteButtons prediction={prediction} onVoted={refetch} />
          )}
          <p className="text-center text-xs text-gray-400 mt-4">
            โหวตทั้งหมด {total.toLocaleString()} ครั้ง
          </p>
        </div>
      </main>
    </div>
  );
}
