import { useState } from 'react'

const STEPS = [
    {
        icon: '🛡️',
        title: 'Admin Control Center',
        desc: 'Selamat datang di Panel Admin! Di sini kamu bisa memantau, mengedit, dan memberikan feedback atas komitmen seluruh karyawan.',
    },
    {
        icon: '📄',
        title: 'Verifikasi Bukti (Proof)',
        desc: 'Klik link "VIEW PROOF" di kolom Attachment untuk mengecek file bukti yang diunggah karyawan. Data ini selalu menampilkan unggahan TERBARU.',
    },
    {
        icon: '🚧',
        title: 'Pantau Tantangan',
        desc: 'Kolom "Obstacles" menampilkan tantangan atau dampak terbaru yang ditulis karyawan. Gunakan ini sebagai bahan pertimbangan saat mereview.',
    },
    {
        icon: '✅',
        title: 'Approve & Decline',
        desc: 'Gunakan tombol "Approve" jika progress sesuai, atau "Decline" jika perlu perbaikan. Kamu wajib mengisi alasan saat menolak (Decline).',
    },
    {
        icon: '🔄',
        title: 'Reset Status',
        desc: 'Gunakan tombol "CLEAR STATUS" jika ingin membatalkan keputusan dan membiarkan karyawan mengupdate kembali progress mereka.',
    },
    {
        icon: '✏️',
        title: 'Edit Komitmen',
        desc: 'Kamu bisa mengedit teks komitmen awal karyawan jika diperlukan melalui tombol pensil di kolom paling kanan.',
    },
]

export default function AdminGuideline({ onClose }) {
    const [step, setStep] = useState(0)
    const current = STEPS[step]
    const isLast = step === STEPS.length - 1

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-100">
                    <div
                        className="h-full bg-brand-dark transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-8 text-center space-y-5">
                    <div className="text-5xl">{current.icon}</div>
                    <div>
                        <p className="text-xs text-brand-dark font-bold uppercase tracking-widest mb-1">
                            Panduan Admin {step + 1} dari {STEPS.length}
                        </p>
                        <h2 className="text-xl font-bold text-slate-800">{current.title}</h2>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{current.desc}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between px-6 pb-6">
                    <button
                        onClick={() => step > 0 ? setStep(step - 1) : onClose()}
                        className="text-sm text-slate-500 hover:text-slate-700 font-medium transition"
                    >
                        {step > 0 ? '← Kembali' : 'Lewati'}
                    </button>
                    <div className="flex items-center gap-1.5">
                        {STEPS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-brand-dark w-6' : 'bg-slate-200 hover:bg-slate-300'}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => isLast ? onClose() : setStep(step + 1)}
                        className="bg-brand-dark text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-slate-800 transition shadow-lg"
                    >
                        {isLast ? 'Mengerti! 🛡️' : 'Lanjut →'}
                    </button>
                </div>
            </div>
        </div>
    )
}
