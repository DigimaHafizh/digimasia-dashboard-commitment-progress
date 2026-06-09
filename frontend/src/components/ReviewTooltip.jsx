const MESSAGES = {
  NOT_MEASURABLE: "Komitmen ini perlu disesuaikan agar dampaknya lebih terukur di pekerjaan.",
  TOO_OPTIMISTIC: "Komitmen ini perlu disesuaikan agar target komitmen ini optimis untuk dicapai dalam waktu 6 bulan.",
  NEW_USER: "Komitmen awal belum tercatat, masukkan komitmen yang ingin kamu capai dalam waktu 6 bulan.",
  NULL: "Komitmen awal belum tercatat, silakan isi komitmen kamu.",
}
export default function ReviewTooltip({ reason }) {
  const msg = MESSAGES[reason];
  if (!msg) return null;

  return (
    <span className="relative group cursor-default">
      <span className="text-warning text-sm">⚠️</span>
      <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block
        bg-slate-800 text-white text-xs rounded-lg px-3 py-2 w-72 max-w-xs shadow-xl z-50 leading-snug whitespace-normal pointer-events-none">
        {msg}
      </span>
    </span>
  )
}

