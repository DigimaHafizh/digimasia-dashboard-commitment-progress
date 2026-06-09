import { useState } from 'react'
import api from '../utils/api'

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Achieved']

export default function AdminUpdateModal({ userToEdit, onClose, onSuccess }) {
    const [status, setStatus] = useState(userToEdit.status || 'Not Started')
    const [challenges, setChallenges] = useState('')
    const [impact, setImpact] = useState('')
    const [saving, setSaving] = useState(false)

    if (!userToEdit) return null

    const handleSave = async () => {
        setSaving(true)
        try {
            await api.patch(`/admin/progress/${userToEdit.id}`, {
                status,
                challenges: status !== 'Achieved' ? challenges : null,
                measurable_impact: status === 'Achieved' ? impact : null
            })
            onSuccess()
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to save admin update.')
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-warning/10">
                    <h3 className="font-bold text-warning-dark">Admin Progress Override</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Updating For</label>
                        <p className="mt-1 font-semibold text-slate-800">{userToEdit.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{userToEdit.initial_commitment}</p>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Force Status To</label>
                        <div className="flex gap-2">
                            {STATUS_OPTIONS.map(s => (
                                <label key={s} className={`flex-1 cursor-pointer border-2 rounded-xl p-2 text-center text-xs font-semibold transition
                  ${status === s ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 text-gray-500'}`}>
                                    <input type="radio" name="admin_status" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
                                    {s}
                                </label>
                            ))}
                        </div>
                    </div>

                    {(status === 'Not Started' || status === 'In Progress') && (
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Admin Note / Challenges</label>
                            <textarea
                                value={challenges} onChange={e => setChallenges(e.target.value)} rows={3}
                                placeholder="Reason for admin override..."
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                            />
                        </div>
                    )}

                    {status === 'Achieved' && (
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Measurable Impact Override</label>
                            <textarea
                                value={impact} onChange={e => setImpact(e.target.value)} rows={3}
                                placeholder="Input impact on behalf of the user..."
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                            />
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button onClick={onClose} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark transition disabled:opacity-50">
                            {saving ? 'Saving...' : 'Confirm Override'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
