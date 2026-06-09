import { useState } from 'react';
import { api } from '../api';

const CATEGORIES = ['general', 'sports', 'politics', 'economy', 'entertainment'];

export default function SuggestModal({ onClose }) {
  const [form, setForm] = useState({ question: '', option_a: '', option_b: '', category: 'general' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/suggestions', form);
      setSent(true);
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        {sent ? (
          <div className="text-center py-4">
            <p className="text-4xl mb-3">🙌</p>
            <p className="font-bold text-gray-800 mb-1">ส่งแล้ว!</p>
            <p className="text-sm text-gray-500 mb-4">แอดมินจะพิจารณาและเพิ่มให้เร็วๆ นี้</p>
            <button onClick={onClose} className="w-full bg-green-500 text-white py-2 rounded-xl font-semibold">ปิด</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">💡 เสนอคำทาย</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <textarea
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                placeholder="คำถาม เช่น ทีมไหนจะชนะ?"
                rows={2}
                maxLength={200}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:border-green-400"
                required
              />
              <input
                value={form.option_a}
                onChange={e => setForm(f => ({ ...f, option_a: e.target.value }))}
                placeholder="ตัวเลือก 1"
                maxLength={80}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-400"
                required
              />
              <input
                value={form.option_b}
                onChange={e => setForm(f => ({ ...f, option_b: e.target.value }))}
                placeholder="ตัวเลือก 2"
                maxLength={80}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-400"
                required
              />
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-400"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl font-semibold"
              >
                {loading ? 'กำลังส่ง...' : 'เสนอคำทาย'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
