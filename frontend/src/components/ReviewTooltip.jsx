const MESSAGES = {
  NOT_MEASURABLE: "Komitmen ini perlu disesuaikan agar dampaknya lebih terukur di pekerjaan.",
  TOO_OPTIMISTIC: "Komitmen ini perlu disesuaikan agar target komitmen ini optimis untuk dicapai dalam waktu 6 bulan.",
  NEW_USER: "Komitmen awal belum tercatat, masukkan komitmen yang ingin kamu capai dalam waktu 6 bulan.",
  NULL: "Komitmen awal belum tercatat, silakan isi komitmen kamu.",
}
export default function ReviewTooltip({ reason }) {
  const msg = MESSAGES[reason];
  if (!msg) return null;

  const isCritical = reason === 'NEW_USER' || reason === 'NULL' || !reason;
  const colorClass = isCritical
    ? 'text-red-700 bg-red-100 border-red-300'
    : 'text-yellow-700 bg-yellow-100 border-yellow-300';

  return (
    <div className="relative group inline-block leading-none">
      <span className={`${colorClass} w-5 h-5 flex items-center justify-center rounded-full text-xs font-black animate-pulse cursor-help border-2 shadow-sm transition-all hover:scale-110`}>
        !
      </span>
      <span className="absolute bottom-full left-0 mb-3 hidden group-hover:block
        bg-slate-900 text-white text-xs rounded-xl px-4 py-2 w-72 max-w-xs shadow-2xl z-50 leading-relaxed whitespace-normal pointer-events-none border border-white/10">
        {msg}
      </span>
    </div>
  )
}

