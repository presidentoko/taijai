import { useState, useEffect } from 'react';

export default function Countdown({ deadline }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) { setTimeLeft('หมดเวลา'); return; }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      setUrgent(diff < 3600000); // under 1 hour = urgent

      if (days > 0) setTimeLeft(`${days} วัน ${hours} ชม.`);
      else if (hours > 0) setTimeLeft(`${hours}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`);
      else setTimeLeft(`${mins}:${String(secs).padStart(2,'0')}`);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    <span className={`text-xs font-mono font-semibold ${urgent ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
      ⏱ {timeLeft}
    </span>
  );
}
