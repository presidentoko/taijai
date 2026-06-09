import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const telegramUrl = import.meta.env.VITE_TELEGRAM_URL || '';

const PACKAGES = [
  { thb: 20, credits: 100, label: 'เริ่มต้น', color: 'border-gray-200' },
  { thb: 50, credits: 300, label: 'ยอดนิยม ⭐', color: 'border-green-400 ring-2 ring-green-200' },
  { thb: 100, credits: 700, label: 'คุ้มที่สุด 🔥', color: 'border-orange-400' },
];

export default function BuyCredits() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(PACKAGES[1]);
  const [qrData, setQrData] = useState(null);
  const [txId, setTxId] = useState(null);
  const [step, setStep] = useState('choose'); // 'choose' | 'pay' | 'sent'

  useEffect(() => {
    if (!user) { navigate('/'); return; }
  }, [user]);

  async function proceed() {
    try {
      const [qrRes, txRes] = await Promise.all([
        api.get(`/payments/qr?amount=${selected.thb}`),
        api.post('/payments/request', { thb: selected.thb }),
      ]);
      setQrData(qrRes);
      setTxId(txRes.transactionId);
      setStep('pay');
    } catch (e) {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  }

  const qrImageUrl = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData.payload)}&size=240x240&margin=10`
    : null;

  const telegramText = `[ทายใจ] ชื่อ: ${user?.displayName}\nID: ${txId}\nจ่าย ${selected.thb} บาท (${selected.credits} เครดิต)\nส่งสลิปมาด้วยนะครับ`;

  if (step === 'sent') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-sm w-full text-center">
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">แจ้งชำระแล้ว!</h2>
          <p className="text-sm text-gray-500 mb-6">
            แอดมินจะตรวจสอบและเติมเครดิตให้ภายใน 24 ชั่วโมง
          </p>
          <Link to="/" className="block bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'pay') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setStep('choose')} className="text-gray-400 hover:text-gray-700">←</button>
            <h1 className="text-xl font-bold text-gray-800">ชำระเงิน</h1>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-1">สแกน PromptPay</p>
            <p className="text-2xl font-bold text-gray-800 mb-4">฿{selected.thb} → {selected.credits} เครดิต</p>

            {qrImageUrl && (
              <img src={qrImageUrl} alt="PromptPay QR" className="w-60 h-60 mx-auto rounded-xl mb-4 border border-gray-100" />
            )}

            <p className="text-xs text-gray-400 mb-6">
              โอนให้ถูกจำนวน {selected.thb} บาท แล้วส่งสลิปมาที่ Telegram
            </p>

            <a
              href={`${telegramUrl}?text=${encodeURIComponent(telegramText)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setStep('sent')}
              className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold mb-3"
            >
              📨 แจ้งชำระผ่าน Telegram
            </a>

            <p className="text-xs text-gray-400">
              แอดมินจะตรวจสอบและเติมเครดิตให้ภายใน 24 ชั่วโมง
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/profile" className="text-gray-400 hover:text-gray-700">←</Link>
          <h1 className="text-xl font-bold text-gray-800">💎 เติมเครดิต</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <p className="text-sm text-gray-500 text-center">
          เครดิตใช้ร่วมทายพิเศษ — ถูกได้รับเครดิตคืนพร้อมโบนัส
        </p>

        {PACKAGES.map(pkg => (
          <button
            key={pkg.thb}
            onClick={() => setSelected(pkg)}
            className={`w-full bg-white rounded-2xl p-4 shadow-sm border-2 transition-all text-left flex items-center justify-between ${
              selected.thb === pkg.thb ? pkg.color : 'border-gray-100'
            }`}
          >
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{pkg.label}</p>
              <p className="text-2xl font-bold text-gray-800">฿{pkg.thb}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-green-600">{pkg.credits.toLocaleString()}</p>
              <p className="text-xs text-gray-400">เครดิต</p>
            </div>
          </button>
        ))}

        <button
          onClick={proceed}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-bold text-lg"
        >
          ชำระ ฿{selected.thb} ด้วย PromptPay
        </button>
      </main>
    </div>
  );
}
