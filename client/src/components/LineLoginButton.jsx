export default function LineLoginButton() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return (
    <a
      href={`${apiUrl}/auth/line`}
      className="inline-flex items-center gap-2 bg-[#06C755] text-white px-4 py-2 rounded-lg font-semibold text-sm"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.52 2.32 6.6 5.8 8.32l-.76 2.84 3.28-1.72c.88.24 1.8.36 2.68.36 5.52 0 10-3.92 10-8.8S17.52 2 12 2z"/>
      </svg>
      เข้าสู่ระบบด้วย LINE
    </a>
  );
}
