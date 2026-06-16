import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import ReviewTooltip from '../components/ReviewTooltip'
import treeImg from '../asset/Pohon 10.png'
import ConfirmModal from '../components/ConfirmModal'
import DeclineModal from '../components/DeclineModal'
import AdminGuideline from '../components/AdminGuideline'

const WARNING_OPTIONS = [
  { value: null, label: 'None', color: 'text-slate-400' },
  { value: 'NOT_MEASURABLE', label: '🟡 Not Measurable', color: 'text-yellow-600' },
  { value: 'TOO_OPTIMISTIC', label: '🟠 Too Optimistic', color: 'text-orange-500' },
  { value: 'NEW_USER', label: '🔴 New User (No Commitment)', color: 'text-red-500' },
]

export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [filter, setFilter] = useState('All')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editWarning, setEditWarning] = useState(null)
  const [editHidden, setEditHidden] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [declineId, setDeclineId] = useState(null)
  const [clearId, setClearId] = useState(null)
  const [showGuideline, setShowGuideline] = useState(false)
  const [showHidden, setShowHidden] = useState(false)

  const fetchData = () => api.get('/admin/commitments').then(r => setData(r.data))
  useEffect(() => { fetchData() }, [])

  const visibleData = data.filter(d => !d.is_admin)
  const filtered = (filter === 'Needs Review'
    ? visibleData.filter(d => d.review_reason && d.review_status === 'Pending')
    : visibleData
  ).filter(d => showHidden ? true : !d.is_hidden)

  const hiddenCount = visibleData.filter(d => d.is_hidden).length

  const handleReview = async (id, review_status, reason = null) => {
    if (review_status === 'Declined' && !reason) {
      setDeclineId(id);
      return;
    }
    setSaving(true)
    try {
      await api.patch(`/admin/progress/${id}`, { review_status, review_reason: reason })
      fetchData()
      setDeclineId(null)
    } catch (e) {
      alert('Failed to update review status.');
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (row) => {
    setEditId(row.id)
    setEditText(row.initial_commitment || '')
    setEditWarning(row.review_reason || null)
    setEditHidden(row.is_hidden || false)
  }
  const cancelEdit = () => { setEditId(null); setEditText(''); setEditWarning(null); setEditHidden(false) }

  const saveEdit = async (id) => {
    setSaving(true)
    try {
      // Single merged call — backend now handles commitment, is_hidden & review_reason together
      await api.patch(`/admin/commitments/${id}`, {
        initial_commitment: editText,
        review_reason: editWarning,
        is_hidden: editHidden,
      })
      fetchData(); cancelEdit()
    } finally { setSaving(false) }
  }


  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-gradient-to-r from-brand-dark to-brand shadow-lg border-b-4 border-white/20 sticky top-0 z-50">
        <div className="max-w-[98%] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0">
              <img src={treeImg} alt="Tree" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-lg leading-tight drop-shadow">Admin Panel</h1>
              <p className="text-white/70 text-xs font-medium tracking-tight">Commitment Management · Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowGuideline(true)} className="text-white/70 hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button onClick={() => navigate('/dashboard')} className="bg-white/10 text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-white/20 transition-all border border-white/10 shadow-inner">View Dashboard</button>
            <button onClick={() => setIsLogoutModalOpen(true)} className="text-white/70 text-xs font-black uppercase tracking-widest hover:text-white transition-all ml-2">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-[98%] mx-auto px-4 py-6 space-y-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 items-center">
          {['All', 'Needs Review'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${filter === f ? 'bg-brand-dark text-white shadow-xl ring-4 ring-brand/10' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>
              {f === 'Needs Review' ? '🟡 Needs Review' : f}
              {f === 'Needs Review' && (
                <span className="ml-2 bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {visibleData.filter(d =>
                    d.review_reason &&
                    d.review_status === 'Pending' &&
                    (showHidden ? true : !d.is_hidden)
                  ).length}
                </span>
              )}
            </button>
          ))}
          {/* Show/Hide hidden users toggle */}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowHidden(v => !v)}
              className={`ml-auto px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                ${showHidden ? 'bg-slate-700 text-white' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showHidden
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                }
              </svg>
              {showHidden ? 'Hide Hidden' : `Show Hidden (${hiddenCount})`}
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest w-16">#</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest min-w-[150px]">Name</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest min-w-[200px]">Commitment</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest w-32">Attachment</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest w-32">Status</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest min-w-[350px]">Obstacles</th>
                  <th className="px-6 py-4 text-center font-black text-slate-400 uppercase text-[10px] tracking-widest w-48">Review Status</th>
                  <th className="px-6 py-4 text-center font-black text-slate-400 uppercase text-[10px] tracking-widest w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row, index) => (
                  <tr key={row.id} className={`hover:bg-slate-50/50 transition-colors 
                    ${row.is_hidden ? 'opacity-50' : ''}
                    ${row.review_status === 'Pending' ? 'bg-yellow-50/30' : row.review_reason ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4 text-slate-400 font-bold text-[11px]">
                      {row.is_hidden && <span className="mr-1 text-slate-300" title="Hidden">👁️‍🗨️</span>}
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {row.name}
                        {!row.initial_commitment?.trim() ? (
                          <ReviewTooltip reason="NEW_USER" />
                        ) : row.review_reason ? (
                          <ReviewTooltip reason={row.review_reason} />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[300px]">
                      {editId === row.id ? (
                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                          {/* Commitment textarea */}
                          <textarea
                            value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                            placeholder="Commitment text..."
                            className="w-full border-2 border-brand rounded-2xl p-4 text-xs font-medium leading-relaxed focus:outline-none focus:ring-4 focus:ring-brand/10 bg-slate-50 shadow-inner resize-none text-slate-700"
                            autoFocus
                          />

                          {/* Warning level picker */}
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Warning Icon</p>
                            <div className="flex flex-wrap gap-2">
                              {WARNING_OPTIONS.map(opt => (
                                <button
                                  key={String(opt.value)}
                                  onClick={() => setEditWarning(opt.value)}
                                  className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all
                                    ${editWarning === opt.value
                                      ? 'bg-brand text-white border-brand shadow-md'
                                      : 'bg-white text-slate-500 border-slate-200 hover:border-brand/40'}`}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Hide toggle */}
                          <label className="flex items-center gap-3 cursor-pointer select-none">
                            <div
                              onClick={() => setEditHidden(v => !v)}
                              className={`relative w-10 h-5 rounded-full transition-all duration-300
                                ${editHidden ? 'bg-slate-700' : 'bg-slate-200'}`}>
                              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300
                                ${editHidden ? 'translate-x-5' : ''}`} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">
                              {editHidden ? '👁️‍🗨️ Hidden from dashboard' : 'Visible on dashboard'}
                            </span>
                          </label>

                          {/* Actions */}
                          <div className="flex gap-2 justify-end">
                            <button onClick={cancelEdit} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-3 py-2 transition-all">Cancel</button>
                            <button
                              onClick={() => saveEdit(row.id)}
                              disabled={saving}
                              className="bg-brand text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-xl hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 disabled:opacity-50">
                              {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-600 text-xs leading-relaxed italic line-clamp-3">
                          {row.initial_commitment ? `"${row.initial_commitment}"` : <span className="text-slate-300">No commitment defined yet.</span>}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {row.latest_attachment_url ? (
                        <a href={`${import.meta.env.VITE_API_URL}${row.latest_attachment_url}`} target="_blank" className="flex items-center gap-2 text-brand hover:text-brand-dark font-black text-[10px] uppercase tracking-widest transition-colors">
                          <span className="text-lg leading-none">📄</span> VIEW PROOF
                        </a>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={row.status} /></td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-[11px] font-bold text-slate-500 line-clamp-2 italic">
                        {row.latest_challenges || <span className="text-slate-300 font-medium">—</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.review_status === 'Pending' ? (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleReview(row.id, 'Accepted')} className="bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-green-600 transition-all shadow-md shadow-green-200">Approve</button>
                          <button onClick={() => handleReview(row.id, 'Declined')} className="bg-white border-2 border-red-100 text-red-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-50 transition-all">Decline</button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border
                             ${row.review_status === 'Accepted' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {row.review_status === 'Accepted' ? '✓ APPROVED' : '✖ DECLINED'}
                          </span>
                          <button onClick={() => setClearId(row.id)} className="text-[9px] font-black text-slate-300 uppercase tracking-tighter hover:text-slate-500 transition-colors">CLEAR STATUS</button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editId === row.id ? (
                        <span className="text-[9px] font-black text-brand uppercase tracking-tighter animate-pulse">Editing...</span>
                      ) : (
                        <button onClick={() => startEdit(row)} className="p-2 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-xl transition-all" title="Edit Commitment & Settings">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DeclineModal
        isOpen={!!declineId}
        onClose={() => setDeclineId(null)}
        onConfirm={(reason) => handleReview(declineId, 'Declined', reason)}
        saving={saving}
      />

      <ConfirmModal
        isOpen={!!clearId}
        title="Reset Review Status?"
        message="This will reset the current decision."
        confirmText="Reset"
        cancelText="Cancel"
        type="warning"
        onConfirm={() => { handleReview(clearId, 'Pending'); setClearId(null); }}
        onCancel={() => setClearId(null)}
      />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Signing Out?"
        message="Are you sure you want to end your current admin session?"
        confirmText="Logout"
        cancelText="Stay Here"
        type="danger"
        onConfirm={logout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      {showGuideline && <AdminGuideline onClose={() => setShowGuideline(false)} />}
    </div>
  )
}
