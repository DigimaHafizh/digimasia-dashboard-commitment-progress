import { useState, useEffect } from 'react'
import api from '../utils/api'
import StatusBadge from './StatusBadge'

export default function NotificationBell() {
    const [history, setHistory] = useState([])
    const [open, setOpen] = useState(false)

    useEffect(() => {
        // Only fetch once or when opened, ideally. For now, fetch once on mount.
        api.get('/commitments/me/history').then(r => setHistory(r.data)).catch(() => { })
    }, [])

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-white/80 hover:text-white transition rounded-full hover:bg-white/10 focus:outline-none"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                {history.length > 0 && (
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-warning rounded-full border border-brand"></span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 text-sm">Activity Timeline</h3>
                        <span className="text-xs text-brand font-medium">{history.length} updates</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {history.length === 0 ? (
                            <p className="p-4 text-center text-sm text-slate-400">No recent activity.</p>
                        ) : (
                            <ul className="divide-y divide-slate-50">
                                {history.map(h => (
                                    <li key={h.id} className="p-4 hover:bg-slate-50 transition">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-xs text-slate-500 font-semibold">
                                                <span className="text-brand">
                                                    {h.updated_by_role === 'Admin' ? `[Admin] ${h.updated_by_name}` : (h.updated_by_name || 'You')}
                                                </span> updated
                                            </p>
                                            <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="mt-2">
                                            <StatusBadge status={h.status} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
