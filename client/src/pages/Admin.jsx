import { useState, useEffect } from 'react';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const CATEGORIES = ['general', 'sports', 'politics', 'economy', 'entertainment'];

function adminFetch(path, options = {}) {
  const secret = localStorage.getItem('admin_secret') || '';
  return fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret, ...(options.headers || {}) },
  }).then(r => r.json());
}

export default function Admin() {
  const [secret, setSecret] = useState(localStorage.getItem('admin_secret') || '');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('predictions'); // 'predictions' | 'users'
  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ question: '', option0: '', option1: '', deadline: '', category: 'general' });
  const [msg, setMsg] = useState('');
  const [creditModal, setCreditModal] = useState(null); // { userId, displayName, txId, credits }

  function login() {
    localStorage.setItem('admin_secret', secret);
    setAuthed(true);
  }

  useEffect(() => { if (authed) loadAll(); }, [authed]);

  async function loadAll() {
    const [s, p, u] = await Promise.all([
      adminFetch('/admin/stats'),
      adminFetch('/admin/predictions'),
      adminFetch('/admin/users'),
    ]);
    setStats(s);
    setPredictions(Array.isArray(p) ? p : []);
    setUsers(Array.isArray(u) ? u : []);
  }

  async function addPrediction(e) {
    e.preventDefault();
    const res = await adminFetch('/admin/predictions', {
      method: 'POST',
      body: JSON.stringify({
        question: form.question,
        options: [form.option0, form.option1],
        deadline: new Date(form.deadline).toISOString(),
        category: form.category,
      }),
    });
    if (res.id) {
      setMsg('เพิ่มสำเร็จ ✅');
      setForm({ question: '', option0: '', option1: '', deadline: '', category: 'general' });
      loadAll();
    } else {
      setMsg(`ผิดพลาด: ${res.error}`);
    }
  }

  async function resolve(id, correctOption) {
    await adminFetch(`/admin/predictions/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ correctOption }),
    });
    loadAll();
  }

  async function deletePrediction(id) {
    if (!confirm('ลบคำทายนี้?')) return;
    await adminFetch(`/admin/predictions/${id}`, { method: 'DELETE' });
    loadAll();
  }

  async function grantCredits(userId, credits, txId) {
    await adminFetch(`/admin/users/${userId}/credits`, {
      method: 'POST',
      body: JSON.stringify({ credits: parseInt(credits), transactionId: txId }),
    });
    setCreditModal(null);
    loadAll();
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 w-80">
          <h1 className="text-xl font-bold text-gray-800 mb-6 text-center">🔐 Admin</h1>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Admin Secret"
            className="w-full border border-gray-200 rounded-xl px-4 py-2 mb-4 text-sm focus:outline-none focus:border-green-400"
          />
          <button onClick={login} className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-semibold">
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">🛠️ Admin Panel</h1>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-800">← หน้าหลัก</a>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-3">
          {['predictions', 'users'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                tab === t ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t === 'predictions' ? '📋 คำทาย' : '👥 ผู้ใช้'}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'คำทาย', value: stats.total_predictions },
              { label: 'เฉลยแล้ว', value: stats.resolved_predictions },
              { label: 'ผู้ใช้', value: stats.total_users },
              { label: 'โหวต', value: stats.total_votes },
              { label: '💰 รอตรวจ', value: stats.pending_payments, highlight: true },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl p-3 shadow-sm border text-center ${s.highlight && parseInt(s.value) > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
                <p className="text-xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'predictions' && (
          <>
            {/* Add prediction */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-4">➕ เพิ่มคำทาย</h2>
              <form onSubmit={addPrediction} className="space-y-3">
                <textarea
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  placeholder="คำถาม"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-400 resize-none"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.option0} onChange={e => setForm(f => ({ ...f, option0: e.target.value }))} placeholder="ตัวเลือก 1" className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-400" required />
                  <input value={form.option1} onChange={e => setForm(f => ({ ...f, option1: e.target.value }))} placeholder="ตัวเลือก 2" className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-400" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-400" required />
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-400">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {msg && <p className="text-sm text-green-600">{msg}</p>}
                <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-semibold">
                  เพิ่มคำทาย
                </button>
              </form>
            </div>

            {/* Predictions list */}
            <div className="space-y-3">
              {predictions.map(p => (
                <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-gray-800 text-sm leading-snug flex-1">{p.question}</p>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">{p.category}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {p.options.map((opt, idx) => (
                      <div key={idx} className={`text-xs px-3 py-1.5 rounded-xl text-center font-medium ${p.resolved && p.correct_option === idx ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                        {opt} ({p.vote_counts?.[idx] || 0})
                      </div>
                    ))}
                  </div>
                  {!p.resolved ? (
                    <div className="flex gap-2">
                      <button onClick={() => resolve(p.id, 0)} className="flex-1 text-xs py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">✓ {p.options[0]}</button>
                      <button onClick={() => resolve(p.id, 1)} className="flex-1 text-xs py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">✓ {p.options[1]}</button>
                      <button onClick={() => deletePrediction(p.id)} className="text-xs py-1.5 px-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 font-medium">ลบ</button>
                    </div>
                  ) : (
                    <p className="text-xs text-green-600 font-medium text-center">✅ เฉลยแล้ว: {p.options[p.correct_option]}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {u.avatar_url && <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full" />}
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{u.display_name}</p>
                      <p className="text-xs text-gray-400">
                        {u.total_predictions}ทาย · {u.correct_predictions}ถูก · 🔥{u.streak} · 💎{u.credits}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCreditModal({ userId: u.id, displayName: u.display_name, txId: '', credits: 100 })}
                    className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-xl font-medium"
                  >
                    + เครดิต
                  </button>
                </div>
                {u.pending_payments?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {u.pending_payments.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between bg-yellow-50 rounded-xl px-3 py-2">
                        <span className="text-xs text-yellow-700">รอตรวจ ฿{tx.amount_thb} → {tx.credits} เครดิต</span>
                        <button
                          onClick={() => setCreditModal({ userId: u.id, displayName: u.display_name, txId: tx.id, credits: tx.credits })}
                          className="text-xs text-green-700 bg-green-100 hover:bg-green-200 px-2 py-1 rounded-lg font-medium"
                        >
                          ✓ อนุมัติ
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Credit modal */}
      {creditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-80">
            <h3 className="font-bold text-gray-800 mb-4">เติมเครดิต: {creditModal.displayName}</h3>
            <input
              type="number"
              value={creditModal.credits}
              onChange={e => setCreditModal(m => ({ ...m, credits: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 mb-3 text-sm focus:outline-none focus:border-green-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => grantCredits(creditModal.userId, creditModal.credits, creditModal.txId)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-semibold text-sm"
              >
                ✓ ยืนยัน
              </button>
              <button
                onClick={() => setCreditModal(null)}
                className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-xl text-sm"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
