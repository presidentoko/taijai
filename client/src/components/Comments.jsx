import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

export default function Comments({ predictionId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  async function load() {
    try {
      const data = await api.get(`/predictions/${predictionId}/comments`);
      setComments(data);
    } catch {}
  }

  useEffect(() => { load(); }, [predictionId]);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const c = await api.post(`/predictions/${predictionId}/comments`, { content: text.trim() });
      setComments(prev => [...prev, c]);
      setText('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {}
    setSending(false);
  }

  async function deleteComment(id) {
    await api.del(`/predictions/${predictionId}/comments/${id}`);
    setComments(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-600 mb-3">
        💬 ความคิดเห็น ({comments.length})
      </h3>

      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-4">ยังไม่มีความคิดเห็น — เป็นคนแรก!</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
              {c.avatar_url
                ? <img src={c.avatar_url} className="w-7 h-7 rounded-full" alt="" />
                : c.display_name?.[0]
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-gray-700">{c.display_name}</span>
                {c.streak >= 3 && <span className="text-xs text-orange-500">🔥{c.streak}</span>}
                <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 mt-0.5 break-words">{c.content}</p>
            </div>
            {user?.userId === c.user_id && (
              <button
                onClick={() => deleteComment(c.id)}
                className="text-xs text-gray-300 hover:text-red-400 shrink-0 self-start mt-1"
              >✕</button>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {user ? (
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="แสดงความคิดเห็น..."
            maxLength={300}
            enterKeyHint="send"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-medium touch-manipulation"
          >
            ส่ง
          </button>
        </form>
      ) : (
        <a
          href={`${apiUrl}/auth/line`}
          className="block text-center text-sm text-green-600 py-3 border border-green-200 rounded-xl hover:bg-green-50"
        >
          เข้าสู่ระบบเพื่อแสดงความคิดเห็น
        </a>
      )}
    </div>
  );
}
