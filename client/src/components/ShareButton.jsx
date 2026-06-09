export default function ShareButton({ prediction, userAccuracy, userRank }) {
  function share() {
    const url = `${window.location.origin}/predictions/${prediction.id}`;
    const total = (prediction.vote_counts || [0, 0]).reduce((a, b) => a + b, 0);

    let text;
    if (userAccuracy !== undefined && userRank) {
      text = `🎯 ทายใจ: ฉันแม่นยำ ${userAccuracy}% อยู่อันดับที่ ${userRank}\n"${prediction.question}"\nมาทายด้วยกัน! ${url}`;
    } else {
      text = `🎯 ทายใจ: "${prediction.question}"\n${total.toLocaleString()} คนร่วมทาย!\nคุณคิดว่าไง? ${url}`;
    }

    if (navigator.share) {
      navigator.share({ text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert('คัดลอกแล้ว! วางแชทได้เลย 📋');
      });
    }
  }

  return (
    <button
      onClick={share}
      className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
    >
      📤 แชร์
    </button>
  );
}
