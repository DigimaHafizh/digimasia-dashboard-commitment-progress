import { useState } from 'react'
import warningImg from '../asset/warning.png'

const STEPS = [
    {
        icon: '📝',
        title: 'Update Progress',
        desc: 'Untuk mulai memperbarui progress komitmenmu, temukan namamu di tabel dashboard dan klik tombol "Update" pada kolom Action paling kanan.',
    },
    {
        icon: '🎯',
        title: 'Isi Komitmen (Karyawan Baru)',
        desc: 'Jika kamu karyawan baru, field "My 6-Month Commitment" akan kosong. Tuliskan komitmenmu yang terukur dan bisa dicapai dalam 6 bulan, selaras dengan HEART Values.',
    },
    {
        icon: '📊',
        title: 'Pilih Status Progress',
        desc: 'Pilih salah satu status:\n• Not Started — Belum mulai dikerjakan\n• In Progress — Sedang berjalan (Wajib upload bukti)\n• Achieved — Sudah tercapai (Wajib upload bukti)',
    },
    {
        icon: '⚡',
        title: 'Isi Obstacles atau Impact',
        desc: 'Ceritakan tantangan yang kamu hadapi (jika In Progress) atau dampak terukur yang telah kamu berikan (jika Achieved).',
    },
    {
        icon: '📎',
        title: 'Upload Bukti Progress',
        desc: 'Untuk status selain "Not Started", kamu wajib mengunggah file bukti (Gambar, PDF, Doc, atau Excel) agar tombol Simpan aktif.',
    },
    {
        icon: '💾',
        title: 'Simpan Progress',
        desc: 'Klik "Save Progress Update". Status review akan berubah menjadi "In Review" dan Admin akan segera memberikan feedback.',
    },
    {
        icon: warningImg,
        isImage: true,
        title: 'Perhatikan Info & Warning',
        desc: 'Jika ada ikon bulat ❗ di samping namamu, hover untuk melihat feedback Admin:\n• NOT_MEASURABLE — Komitmen perlu lebih terukur\n• TOO_OPTIMISTIC — Target terlalu optimis untuk 6 bulan\n• NEW_USER — Silakan isi komitmen awalmu',
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
                        {current.isImage ? (
                            <img src={current.icon} alt="Icon" className="w-12 h-12 object-contain" />
                        ) : (
                            <div className="text-5xl">{current.icon}</div>
                        )}
                    </div>
                    <div>
                        <p className="text-xs text-brand font-bold uppercase tracking-widest mb-1">
                            Langkah {step + 1} dari {STEPS.length}
                        </p>
                        <h2 className="text-xl font-bold text-slate-800">{current.title}</h2>
                    </div>

                    {/* Multi-line Description with custom list handling */}
                    <div className="text-sm text-slate-600 leading-relaxed text-center">
                        <div className="inline-block text-left max-w-[90%] mx-auto">
                            <p className="mb-2 text-center">
                                {current.desc.split('\n')[0].split('❗').map((part, i, arr) => (
                                    <span key={i}>
                                        {part}
                                        {i < arr.length - 1 && (
                                            <img src={warningImg} alt="Warning" className="inline-block w-4 h-4 mx-1 mb-1 align-middle" />
                                        )}
                                    </span>
                                ))}
                            </p>

                            {current.desc.includes('\n•') && (
                                <ul className="space-y-1.5 mt-2">
                                    {current.desc.split('\n').slice(1).map((line, i) => (
                                        <li key={i} className="flex gap-2 items-start transition-all duration-300">
                                            <span className="text-brand shrink-0 mt-1">•</span>
                                            <span className="text-[12px] font-medium text-slate-700 leading-5">{line.replace('• ', '')}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
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
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-brand w-6' : 'bg-slate-200 hover:bg-slate-300'}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => isLast ? onClose() : setStep(step + 1)}
                        className="bg-brand text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-brand-dark transition"
                    >
                        {isLast ? 'Mulai! 🚀' : 'Lanjut →'}
                    </button>
                </div>
            </div>
        </div>
    )
}
