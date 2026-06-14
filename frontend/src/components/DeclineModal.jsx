import React from 'react'

export default function DeclineModal({ isOpen, onClose, onConfirm, saving }) {
    const [reason, setReason] = React.useState('')

    React.useEffect(() => {
        if (isOpen) setReason('')
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-2xl mb-4">
                            🚫
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Decline Update?</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            Please provide a reason for declining this progress update. This will be shared with the employee to help them improve.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Decline Reason</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={4}
                            placeholder="e.g. Please provide more clear metrics or actual proof documents..."
                            className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 bg-slate-50 transition-all resize-none shadow-inner"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(reason)}
                            disabled={saving || !reason.trim()}
                            className="flex-1 py-3.5 bg-red-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg shadow-red-200"
                        >
                            {saving ? 'Processing...' : 'Confirm Decline'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
