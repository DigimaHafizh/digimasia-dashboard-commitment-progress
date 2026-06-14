import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import ActivityModal from '../components/ActivityModal'

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Achieved']

export default function UpdatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState('Not Started')
  const [challenges, setChallenges] = useState('')
  const [impact, setImpact] = useState('')
  const [commitment, setCommitment] = useState('')
  const [history, setHistory] = useState([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const fetchData = () => {
    api.get('/commitments/me').then(r => {
      setForm(r.data)
      setStatus(r.data.status || 'Not Started')
      setImpact(r.data.measurable_impact || '')
      setChallenges('') // Start fresh for every update
      setCommitment(r.data.initial_commitment || '')
    })
    api.get('/commitments/me/history').then(r => setHistory(r.data))
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl('NON_IMAGE')
    }
  }, [file])

  const handleSave = async () => {
    // Strict rule: Every update must have a NEW attachment
    if (status !== 'Not Started' && !file) {
      alert(`Please select an evidence/attachment before saving "${status}" status.`);
      return;
    }

    setSaving(true); setSuccess('')
    try {
      const formData = new FormData();
      formData.append('status', status);
      if (status !== 'Achieved' && challenges) formData.append('challenges', challenges);
      if (status === 'Achieved' && impact) formData.append('measurable_impact', impact);
      if (form?.review_reason === 'NEW_USER') formData.append('initial_commitment', commitment);
      if (file) formData.append('attachment', file);

      await api.patch('/commitments/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Clear one-time input fields after success
      setChallenges('')
      setFile(null)

      await fetchData()
      setSuccess('Your progress has been saved successfully! ✅')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save. Please try again.')
    } finally { setSaving(false) }
  }

  if (!form) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading your commitment...</div>

  const isDirty = status !== (form.status || 'Not Started') ||
    challenges !== '' || // Challenges is now always initialized as empty on load
    impact !== (form.measurable_impact || '') ||
    (form.review_reason === 'NEW_USER' && commitment !== (form.initial_commitment || '')) ||
    !!file;

  const isAccepted = ['accepted', 'approved'].includes(form.review_status?.toLowerCase());
  const isPending = form.review_status?.toLowerCase() === 'pending' || !form.review_status;

  // Strict rule: Proof is ONLY valid if a NEW file is selected in this session
  const hasProof = !!file;

  const isSaveable = isAccepted && isDirty && (status === 'Not Started' || hasProof) && (status !== 'Achieved' || !!impact.trim());

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
          <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => navigate('/dashboard')}>Home</span>
          <span>/</span>
          <span className="text-brand">My Commitment</span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Update My Progress</h2>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Form Content */}
        <div className="lg:col-span-2 space-y-6">
          {isPending && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4 duration-500">
              <div className="bg-yellow-100 border-2 border-yellow-300 text-yellow-700 w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center text-xl shadow-inner italic">⌛</div>
              <div>
                <h3 className="font-extrabold text-yellow-900">Current Status: In Review</h3>
                <p className="text-yellow-700/80 text-sm mt-0.5 font-medium italic">Management is checking your latest update. You can still modify and upload before it is finalized.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[24px] shadow-sm p-8 space-y-7 border border-slate-200/60">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Employee Name</label>
              <p className="text-lg font-black text-slate-900 leading-none">{user?.name}</p>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">My 6-Month Commitment</label>
              {form.review_reason === 'NEW_USER' ? (
                <textarea
                  value={commitment} onChange={e => setCommitment(e.target.value)} rows={3}
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand bg-slate-50 transition-all"
                  placeholder="Enter your specific commitment..."
                />
              ) : (
                <div className="bg-slate-50/80 border-2 border-slate-100 rounded-2xl p-4 text-sm text-slate-700 italic font-medium">
                  {form.initial_commitment || '—'}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Commitment Status</label>
              <div className="grid grid-cols-3 gap-3">
                {STATUS_OPTIONS.map(s => (
                  <label key={s} className={`flex-1 transition-all rounded-2xl p-3.5 text-center text-[11px] font-black uppercase tracking-widest border-2
                    ${!isAccepted ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-brand/40'}
                    ${status === s ? 'border-brand bg-brand/5 text-brand shadow-sm shadow-brand/10' : 'border-slate-100 text-slate-400'}`}>
                    <input type="radio" name="status" value={s} checked={status === s} disabled={!isAccepted} onChange={() => setStatus(s)} className="sr-only" />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-6 pt-2">
              {(status === 'Not Started' || status === 'In Progress') && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Obstacles & Challenges</label>
                  <textarea
                    value={challenges}
                    onChange={e => { setChallenges(e.target.value); setSuccess(''); }}
                    rows={5}
                    readOnly={!isAccepted}
                    className={`w-full border-2 border-slate-100 rounded-2xl p-4 text-sm focus:outline-none transition-all shadow-inner resize-none
                      ${!isAccepted ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed italic' : 'bg-slate-50 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand'}`}
                    placeholder="Describe any issues holding you back..."
                  />
                </div>
              )}

              {status === 'Achieved' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Measurable Impact</label>
                  <textarea
                    value={impact}
                    onChange={e => { setImpact(e.target.value); setSuccess(''); }}
                    rows={5}
                    readOnly={!isAccepted}
                    className={`w-full border-2 border-slate-100 rounded-2xl p-4 text-sm focus:outline-none transition-all shadow-inner resize-none
                      ${!isAccepted ? 'bg-slate-100/50 text-slate-400 cursor-not-allowed italic' : 'bg-slate-50 focus:bg-white focus:ring-4 focus:ring-brand/10 focus:border-brand'}`}
                    placeholder="Provide specific metrics of your achievement..."
                  />
                </div>
              )}
            </div>

            {success && <p className="text-green-600 text-xs font-bold bg-green-50 p-3 rounded-xl border border-green-100">{success}</p>}
            <button
              onClick={handleSave} disabled={saving || !isSaveable}
              className={`w-full py-4 text-white font-black text-[12px] uppercase tracking-widest rounded-2xl transition-all shadow-lg 
                ${!isSaveable ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-brand hover:bg-brand-dark shadow-brand/10'}`}
            >
              {!isAccepted ? 'Locked Pending Admin Acceptance' :
                (status !== 'Not Started' && !hasProof) ? 'Evidence Required to Save' :
                  (saving ? 'Saving...' : 'Save Progress Update')}
            </button>
          </div>

          <div className="bg-white rounded-[24px] shadow-sm p-8 border border-slate-200/60">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">My Growth Feedback History</h3>
            {history.length > 0 ? (
              <div className="space-y-6">
                {history.map((h, i) => (
                  <div key={h.id} className="relative pl-6 border-l-2 border-slate-100 group hover:border-brand transition-colors cursor-pointer" onClick={() => setSelectedActivity(h)}>
                    <div className="absolute -left-1.5 top-0 w-2.5 h-2.5 rounded-full bg-slate-200 group-hover:bg-brand transition-all border-2 border-white" />
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500 font-bold leading-none">
                        {h.updated_by_role === 'Admin' ? '[Admin Feedback]' : 'Self Update'} • <span className="text-slate-400">{new Date(h.created_at).toLocaleDateString()}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={h.status} />
                        <span className="text-xs font-black text-slate-700 tracking-tight">{h.updated_by_name || 'You'}</span>
                      </div>
                      {h.measurable_impact && <p className="text-xs text-slate-500 italic line-clamp-1">"{h.measurable_impact}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-slate-300 text-xs italic font-medium">No activity recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Evidence Control */}
        <div className="space-y-6">
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 p-8 flex flex-col items-center relative overflow-hidden group">

            <div className="w-full space-y-6">
              <div className="text-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proof Section</h3>
                <p className="text-base font-black text-slate-900">Evidence Control</p>
              </div>

              <div className={`relative border-3 border-dashed rounded-[32px] p-8 transition-all flex flex-col items-center justify-center min-h-[220px] 
                ${isAccepted ? 'border-slate-100 hover:border-brand/30 hover:bg-slate-50/50' : 'border-slate-50 bg-slate-50/20'}`}>
                <input
                  type="file" disabled={!isAccepted}
                  className={`absolute inset-0 w-full h-full opacity-0 z-10 ${isAccepted ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onChange={e => setFile(e.target.files[0])}
                  onClick={e => { e.target.value = null; }}
                />

                <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center text-4xl mb-4 shadow-inner ring-4 ring-white">
                  {previewUrl === 'NON_IMAGE' ? '📄' : previewUrl ? <img src={previewUrl} className="w-full h-full object-cover rounded-[24px]" alt="Preview" /> : '📁'}
                </div>

                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-800 break-normal whitespace-nowrap leading-relaxed font-black">
                    {file ? file.name : 'Drop file here'}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-black tracking-widest leading-normal">
                    Max 5MB • PDF / DOC / IMG
                  </p>
                </div>

                {file && (
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-black shadow-lg z-20 hover:scale-110 transition-transform">×</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActivityModal item={selectedActivity} onClose={() => setSelectedActivity(null)} />
    </div>
  )
}
