import { useState } from 'react'
import { IconShield, IconClock, IconDocument, IconTools, IconCheckCircle, IconWarning, IconRefresh, IconDownload, IconArrowLeft, IconArrowRight } from './icons'

const STEPS = [
    {
        Icon: IconShield,
        title: 'Admin Control Center',
        desc: 'Selamat datang di Panel Admin! Di sini kamu bisa memantau komitmen seluruh karyawan dan mereview pengajuan yang masuk.',
    },
    {
        Icon: IconClock,
        title: 'Filter "On Review"',
        desc: 'Gunakan tab "On Review" untuk mengisolasi komitmen baru atau hasil resubmit yang sedang menunggu keputusanmu, lengkap dengan badge jumlahnya.',
    },
    {
        Icon: IconDocument,
        title: 'Verifikasi Bukti (Proof)',
        desc: 'Klik link "VIEW PROOF" di kolom Attachment untuk mengecek file bukti terbaru yang diunggah karyawan pada komitmen yang sedang aktif.',
    },
    {
        Icon: IconTools,
        title: 'Pantau Obstacles',
        desc: 'Kolom "Obstacles" menampilkan tantangan terbaru yang ditulis karyawan saat status "In Progress" — gunakan sebagai bahan pertimbangan review.',
    },
    {
        Icon: IconCheckCircle,
        title: 'Approve',
        desc: 'Klik "Approve" jika komitmen atau update progress sudah jelas dan terukur. Karyawan langsung bisa lanjut melacak progress-nya. Setiap update status (In Progress/Achieved) juga perlu di-Approve dulu.',
    },
    {
        Icon: IconWarning,
        title: 'Decline',
        desc: 'Klik "Decline" jika perlu perbaikan. Kamu wajib mengisi komentar — karyawan akan melihatnya dan bisa merevisi lalu submit ulang.',
    },
    {
        Icon: IconRefresh,
        title: 'Reset Review',
        desc: 'Gunakan tombol "RESET REVIEW" jika ingin membatalkan keputusan Approve/Decline dan mengembalikan submission ke status "On Review".',
    },
    {
        Icon: IconDownload,
        title: 'Export Laporan',
        desc: 'Gunakan tombol "Export Commitments" di bagian atas tabel untuk mengunduh laporan Excel seluruh komitmen dan status karyawan.',
    },
    {
        Icon: IconTools,
        title: 'Kelola User',
        desc: 'Gunakan tombol "Add User" untuk menambah karyawan baru (nama + PIN 4 digit), atau ikon tempat sampah di tiap baris untuk menghapus user beserta seluruh riwayatnya.',
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
                    <div className="flex justify-center">
                        <div className="w-14 h-14 bg-brand-dark/5 text-brand-dark rounded-2xl flex items-center justify-center">
                            <current.Icon className="w-7 h-7" />
                        </div>
                    </div>
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
                        className="text-sm text-slate-500 hover:text-slate-700 font-medium transition flex items-center gap-1"
                    >
                        {step > 0 ? <><IconArrowLeft className="w-4 h-4" /> Kembali</> : 'Lewati'}
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
                        className="bg-brand-dark text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-slate-800 transition shadow-lg flex items-center gap-1.5"
                    >
                        {isLast ? <>Mengerti! <IconShield className="w-4 h-4" /></> : <>Lanjut <IconArrowRight className="w-4 h-4" /></>}
                    </button>
                </div>
            </div>
        </div>
    )
}
