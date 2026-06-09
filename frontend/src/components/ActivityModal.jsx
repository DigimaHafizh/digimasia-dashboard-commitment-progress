export default function ActivityModal({ item, onClose }) {
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-slate-800">Activity Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="p-6 space-y-4 text-sm">
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Updated By</span>
                        <p className="mt-1 font-medium text-slate-700">
                            {item.updated_by_role === 'Admin' ? `[Admin] ${item.updated_by_name}` : 'You'}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Date</span>
                        <p className="mt-1 font-medium text-slate-700">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase">Status Submitted</span>
                        <p className="mt-1 font-medium text-slate-700">{item.status}</p>
                    </div>
                    {item.status !== 'Achieved' && item.challenges && (
                        <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase">Obstacles / Challenges</span>
                            <p className="mt-1 font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{item.challenges}</p>
                        </div>
                    )}
                    {item.status === 'Achieved' && item.measurable_impact && (
                        <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase">Measurable Impact</span>
                            <p className="mt-1 font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{item.measurable_impact}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
