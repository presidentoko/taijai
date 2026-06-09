import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <p className="text-6xl mb-4">🎯</p>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">หน้านี้ไม่มีอยู่</h1>
      <p className="text-gray-400 mb-6 text-sm">ลิงก์อาจผิดหรือถูกลบไปแล้ว</p>
      <Link
        to="/"
        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-semibold transition-colors"
      >
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
