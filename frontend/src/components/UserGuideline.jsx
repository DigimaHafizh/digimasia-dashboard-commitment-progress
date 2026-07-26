import { useState } from 'react'
import { IconTarget, IconClock, IconWarning, IconCheckCircle, IconBolt, IconPaperclip, IconBell, IconArrowLeft, IconArrowRight, IconRocket } from './icons'

const STEPS = [
    {
        Icon: IconTarget,
        title: 'Ajukan Komitmenmu',
        desc: 'Klik tombol "Add My Commitment" di halaman update, lalu tuliskan komitmenmu yang terukur dan selaras dengan HEART Values.',
    },
    {
        Icon: IconClock,
        title: 'Menunggu Review',
        desc: 'Setelah disubmit, status berubah menjadi "On Review". Teks komitmenmu terkunci (read-only) sampai Admin memberi keputusan.',
    },
    {
        Icon: IconWarning,
        title: 'Jika Ditolak (Rejected)',
        desc: 'Kamu akan melihat komentar Admin langsung di form. Revisi komitmenmu sesuai masukan, lalu submit ulang untuk direview kembali.',
    },
    {
        Icon: IconCheckCircle,
        title: 'Jika Diterima (Accepted)',
        desc: 'Komitmenmu terkunci permanen dan progress tracking terbuka. Pilih status "In Progress" atau "Achieved" untuk mulai update.',
    },
    {
        Icon: IconBolt,
        title: 'Isi Obstacles atau Impact',
        desc: 'Pilih "In Progress" → ceritakan tantangan yang kamu hadapi. Pilih "Achieved" → jelaskan dampak terukur yang sudah tercapai.',
    },
    {
        Icon: IconPaperclip,
        title: 'Upload Bukti Progress',
        desc: 'Setiap update progress wajib disertai file bukti baru (Gambar, PDF, atau Doc, maksimal 5MB) agar tombol Simpan aktif.',
    },
    {
        Icon: IconBell,
        title: 'Cek Notifikasi & Riwayat',
        desc: 'Klik ikon lonceng di header untuk melihat hasil review terbaru dari Admin. Riwayat lengkap aktivitasmu selalu tersedia di bagian bawah form.',
    },
]

export default function UserGuideline({ onClose }) {
    const [step, setStep] = useState(0)
    const current = STEPS[step]
    const isLast = step === STEPS.length - 1

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-100">
                    <div
                        className="h-full bg-brand transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-8 text-center space-y-5">
                    <div className="flex justify-center">
                        <div className="w-14 h-14 bg-brand/5 text-brand rounded-2xl flex items-center justify-center">
                            <current.Icon className="w-7 h-7" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-brand font-bold uppercase tracking-widest mb-1">
                            Langkah {step + 1} dari {STEPS.length}
                        </p>
                        <h2 className="text-xl font-bold text-slate-800">{current.title}</h2>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed text-center max-w-[90%] mx-auto">
                        {current.desc}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between px-6 pb-6">
                    <button
                        onClick={() => step > 0 ? setStep(step - 1) : onClose()}
                        className="text-sm text-slate-500 hover:text-slate-700 font-medium transition flex items-center gap-1"
                    >
                        {step > 0 ? <><IconArrowLeft className="w-4 h-4" /> Kembali</> : 'Lewati'}
                    </button>
                    <div className="flex items-center gap-1.5">
                        {STEPS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-brand w-6' : 'bg-slate-200 hover:bg-slate-300'}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => isLast ? onClose() : setStep(step + 1)}
                        className="bg-brand text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-brand-dark transition flex items-center gap-1.5"
                    >
                        {isLast ? <>Mulai! <IconRocket className="w-4 h-4" /></> : <>Lanjut <IconArrowRight className="w-4 h-4" /></>}
                    </button>
                </div>
            </div>
        </div>
    )
}
