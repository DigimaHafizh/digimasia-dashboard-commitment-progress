import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import ActivityModal from '../components/ActivityModal'
import NotificationBell from '../components/NotificationBell'
import UserGuideline from '../components/UserGuideline'
import ConfirmModal from '../components/ConfirmModal'
import treeImg from '../asset/Pohon 10.png'
import { IconCheckCircle, IconWarning, IconClock, IconCheck, IconDocument, IconFolder, IconLock, IconWave, IconArrowRight } from '../components/icons'

const STATUS_OPTIONS = ['In Progress', 'Achieved']
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function UpdatePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [showGuideline, setShowGuideline] = useState(() => {
    return localStorage.getItem(`has_seen_guidelined_${user?.id}`) !== 'true'
  })
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState('In Progress')
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
      setStatus(r.data.status || 'In Progress')
      setImpact(r.data.measurable_impact || '')
      setChallenges('')
      setCommitment(r.data.initial_commitment || '')
    })
    api.get('/commitments/me/history').then(r => setHistory(r.data))
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl('NON_IMAGE')
    }
  }, [file])

  // Submit new commitment (first time or after decline)
  const handleSubmitCommitment = async () => {
    if (!commitment.trim()) {
      alert('Please enter your commitment statement before submitting.')
      return
    }
    setSaving(true); setSuccess('')
    try {
      const formData = new FormData()
      formData.append('initial_commitment', commitment.trim())
      await api.patch('/commitments/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchData()
      setSuccess('Your commitment has been submitted! Waiting for Admin review.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to submit. Please try again.')
    } finally { setSaving(false) }
  }

  const handleFileChange = (selected) => {
    if (!selected) return
    if (!ALLOWED_MIME_TYPES.includes(selected.type)) {
      alert('Unsupported file type. Only PDF, DOC/DOCX, and images (JPG/PNG/WEBP/GIF) are allowed.')
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      alert('File is too large. Maximum size is 5MB.')
      return
    }
    setFile(selected)
  }

  // Submit progress update (only when commitment Accepted and no update already pending)
  const handleSave = async () => {
    if (status !== 'In Progress' && !file) {
      alert(`Please select an attachment before submitting "${status}" status.`)
      return
    }
    setSaving(true); setSuccess('')
    try {
      const formData = new FormData()
      formData.append('status', status)
      if (status === 'In Progress' && challenges) formData.append('challenges', challenges)
      if (status === 'Achieved' && impact) formData.append('measurable_impact', impact)
      if (file) formData.append('attachment', file)

      await api.patch('/commitments/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setChallenges(''); setFile(null)
      await fetchData()
      setSuccess('Your progress update has been submitted! Waiting for Admin review.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to submit. Please try again.')
    } finally { setSaving(false) }
  }

  if (!form) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading your commitment...</div>

  const reviewStatus = form.review_status
  const isAccepted = reviewStatus === 'Accepted'
  const isOnReview = reviewStatus === 'On Review'
  const isRejected = reviewStatus === 'Rejected'
  const hasNoCommitment = !form.initial_commitment?.trim()
  const canSubmitCommitment = hasNoCommitment || isRejected
  const hasProof = !!file

  const progressPending = isAccepted && form.progress_status === 'On Review'
  const progressDeclined = isAccepted && form.progress_status === 'Rejected'

  const isDirty = status !== (form.status || 'In Progress') || challenges !== '' || impact !== (form.measurable_impact || '') || !!file
  const isSaveable = isAccepted && !progressPending && isDirty && (status === 'In Progress' || hasProof) && (status !== 'Achieved' || !!impact.trim())

  const handleCloseGuideline = () => {
    localStorage.setItem(`has_seen_guidelined_${user?.id}`, 'true')
    setShowGuideline(false)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <nav className="bg-gradient-to-r from-brand-dark to-brand shadow-lg border-b-4 border-white/20 sticky top-0 z-10">
        <div className="max-w-[98%] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0">
              <img src={treeImg} alt="Tree" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-lg leading-tight drop-shadow">My Commitment Progress</h1>
              <p className="text-white/70 text-xs font-medium">X-Traordinary · Grow With Heart</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/90 text-sm font-semibold bg-white/10 px-3 py-1 rounded-full hidden sm:flex items-center gap-1.5">Hi, {user?.name} <IconWave className="w-4 h-4" /></span>
            <button onClick={() => setShowGuideline(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition" title="Show Guideline">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <NotificationBell />
            {user?.is_admin && (
              <button onClick={() => navigate('/admin')} className="bg-white text-brand text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-brand-light hover:text-white transition shadow-sm">Admin Panel</button>
            )}
            <button onClick={() => setIsLogoutModalOpen(true)} className="text-white/70 text-xs font-black uppercase tracking-widest hover:text-white transition-all ml-2">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* --- STATUS BANNERS --- */}

          {/* Commitment declined banner — shows admin comment */}
          {isRejected && form.review_reason && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4 duration-500">
              <div className="bg-red-100 border-2 border-red-300 text-red-700 w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center shadow-inner"><IconWarning className="w-5 h-5" /></div>
              <div>
                <h3 className="font-extrabold text-red-900">Commitment Declined — Please Revise</h3>
                <p className="text-red-700/80 text-sm mt-1 font-medium leading-relaxed">
                  <span className="font-black">Admin Review Comment:</span> {form.review_reason}
                </p>
                <p className="text-red-500/70 text-xs mt-2 font-medium italic">Please revise your commitment below and resubmit for review.</p>
              </div>
            </div>
          )}

          {/* Commitment On Review banner */}
          {isOnReview && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4 duration-500">
              <div className="bg-yellow-100 border-2 border-yellow-300 text-yellow-700 w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center shadow-inner"><IconClock className="w-5 h-5" /></div>
              <div>
                <h3 className="font-extrabold text-yellow-900">Commitment Under Review</h3>
                <p className="text-yellow-700/80 text-sm mt-0.5 font-medium italic">Your commitment has been submitted and is waiting for Admin evaluation. You cannot edit it while it's being reviewed.</p>
              </div>
            </div>
          )}

          {/* Commitment approved banner */}
          {isAccepted && !progressPending && !progressDeclined && (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
              <div className="bg-green-100 border-2 border-green-300 text-green-700 w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center shadow-inner"><IconCheck className="w-5 h-5" /></div>
              <div>
                <h3 className="font-extrabold text-green-900">Commitment Approved!</h3>
                <p className="text-green-700/80 text-sm mt-0.5 font-medium">Your commitment has been approved. You can now track your progress below.</p>
              </div>
            </div>
          )}

          {/* Progress update pending banner */}
          {progressPending && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4 duration-500">
              <div className="bg-yellow-100 border-2 border-yellow-300 text-yellow-700 w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center shadow-inner"><IconClock className="w-5 h-5" /></div>
              <div>
                <h3 className="font-extrabold text-yellow-900">Progress Update Under Review</h3>
                <p className="text-yellow-700/80 text-sm mt-0.5 font-medium italic">Your update to "{form.status}" has been submitted and is waiting for Admin evaluation.</p>
              </div>
            </div>
          )}

          {/* Progress update declined banner */}
          {progressDeclined && form.progress_review_reason && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4 duration-500">
              <div className="bg-red-100 border-2 border-red-300 text-red-700 w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center shadow-inner"><IconWarning className="w-5 h-5" /></div>
              <div>
                <h3 className="font-extrabold text-red-900">Progress Update Declined — Please Revise</h3>
                <p className="text-red-700/80 text-sm mt-1 font-medium leading-relaxed">
                  <span className="font-black">Admin Review Comment:</span> {form.progress_review_reason}
                </p>
                <p className="text-red-500/70 text-xs mt-2 font-medium italic">Please revise your update below and resubmit for review.</p>
              </div>
            </div>
          )}

          {/* --- MAIN FORM CARD --- */}
          <div className="bg-white rounded-[24px] shadow-sm p-8 space-y-7 border border-slate-200/60">
            {/* Name — always read-only */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Employee Name</label>
              <p className="text-lg font-black text-slate-900 leading-none">{user?.name}</p>
            </div>

            {/* Commitment field */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                My Commitment
                {canSubmitCommitment && <span className="ml-2 text-brand">— Click submit to send for Admin review</span>}
              </label>

              {canSubmitCommitment ? (
                <div className="space-y-3">
                  <textarea
                    value={commitment}
                    onChange={e => setCommitment(e.target.value)}
                    rows={4}
                    className="w-full border-2 border-brand/40 rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand bg-slate-50 transition-all"
                    placeholder="Write your specific, measurable commitment here..."
                    autoFocus
                  />
                  {success && <p className="text-green-600 text-xs font-bold bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-2"><IconCheckCircle className="w-4 h-4 flex-shrink-0" /> {success}</p>}
                  <button
                    onClick={handleSubmitCommitment}
                    disabled={saving || !commitment.trim()}
                    className={`w-full py-4 text-white font-black text-[12px] uppercase tracking-widest rounded-2xl transition-all shadow-lg
                      ${!commitment.trim() || saving ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-brand hover:bg-brand-dark shadow-brand/10'}`}
                  >
                    {saving ? 'Submitting...' : isRejected ? 'Resubmit Commitment for Review' : 'Submit'}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50/80 border-2 border-slate-100 rounded-2xl p-4 text-sm text-slate-700 italic font-medium">
                  {form.initial_commitment || '—'}
                </div>
              )}
            </div>

            {/* Progress tracking — only visible when Accepted */}
            {isAccepted && (
              progressPending ? (
                <div className="bg-slate-50/80 border-2 border-slate-100 rounded-2xl p-6 text-center">
                  <p className="text-sm font-black text-slate-600">Your update to "{form.status}" is awaiting Admin review.</p>
                  <p className="text-xs text-slate-400 mt-1">You'll be able to submit another update once this one is reviewed.</p>
                </div>
              ) : (
              <>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Commitment Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    {STATUS_OPTIONS.map(s => (
                      <label key={s} className={`flex-1 transition-all rounded-2xl p-3.5 text-center text-[11px] font-black uppercase tracking-widest border-2 cursor-pointer hover:border-brand/40
                        ${status === s ? 'border-brand bg-brand/5 text-brand shadow-sm shadow-brand/10' : 'border-slate-100 text-slate-400'}`}>
                        <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 pt-2">
                  {status === 'In Progress' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Deskripsi Progress</label>
                      <textarea
                        value={challenges}
                        onChange={e => { setChallenges(e.target.value); setSuccess('') }}
                        rows={5}
                        className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand bg-slate-50 transition-all shadow-inner resize-none"
                        placeholder="Describe any issues holding you back..."
                      />
                    </div>
                  )}

                  {status === 'Achieved' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Measurable Impact</label>
                      <textarea
                        value={impact}
                        onChange={e => { setImpact(e.target.value); setSuccess('') }}
                        rows={5}
                        className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand bg-slate-50 transition-all shadow-inner resize-none"
                        placeholder="Provide specific metrics of your achievement..."
                      />
                    </div>
                  )}
                </div>

                {success && <p className="text-green-600 text-xs font-bold bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-2"><IconCheckCircle className="w-4 h-4 flex-shrink-0" /> {success}</p>}
                <button
                  onClick={handleSave} disabled={saving || !isSaveable}
                  className={`w-full py-4 text-white font-black text-[12px] uppercase tracking-widest rounded-2xl transition-all shadow-lg
                    ${!isSaveable ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-brand hover:bg-brand-dark shadow-brand/10'}`}
                >
                  {(status !== 'In Progress' && !hasProof) ? 'Attachment Required to Submit' : (saving ? 'Submitting...' : 'Submit')}
                </button>
              </>
              )
            )}
          </div>

          {/* History */}
          <div className="bg-white rounded-[24px] shadow-sm p-8 border border-slate-200/60">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Growth Feedback History</h3>
              {history.length > 0 && <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Click any entry for details</span>}
            </div>
            {history.length > 0 ? (
              <div className="space-y-2">
                {history.map(h => (
                  <div
                    key={h.id}
                    onClick={() => setSelectedActivity(h)}
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-brand/10 hover:bg-brand/[0.03] hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 group-hover:bg-brand transition-all flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-[11px] text-slate-500 font-bold leading-none">
                        {h.updated_by_role === 'Admin' ? '[Admin Feedback]' : 'Self Update'} • <span className="text-slate-400">{new Date(h.created_at).toLocaleDateString('id-ID')}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={h.status} />
                        <span className="text-xs font-black text-slate-700 tracking-tight">{h.updated_by_name || 'You'}</span>
                      </div>
                      {h.measurable_impact && (
                        <p className="text-xs text-slate-500 italic line-clamp-1">
                          "{h.measurable_impact.replace('Commitment Rejected: ', '').replace('Review Declined: ', '').replace('Commitment Declined: ', '').replace('Progress Update Declined: ', '')}"
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 text-slate-300 group-hover:text-brand transition-all">
                      <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Details</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-slate-300 text-xs italic font-medium">No activity recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Attachment Upload */}
        <div className="space-y-6">
          {isAccepted && !progressPending ? (
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 p-8 flex flex-col items-center relative overflow-hidden">
              <div className="w-full space-y-6">
                <div className="text-center">
                  <p className="text-base font-black text-slate-900">Upload Attachment</p>
                </div>

                <div className="relative border-2 border-dashed rounded-[32px] p-8 transition-all flex flex-col items-center justify-center min-h-[220px] border-slate-100 hover:border-brand/30 hover:bg-slate-50/50">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    onChange={e => handleFileChange(e.target.files[0])}
                    onClick={e => { e.target.value = null }}
                  />

                  <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-400 mb-4 shadow-inner ring-4 ring-white">
                    {previewUrl === 'NON_IMAGE' ? <IconDocument className="w-9 h-9" /> : previewUrl ? <img src={previewUrl} className="w-full h-full object-cover rounded-[24px]" alt="Preview" /> : <IconFolder className="w-9 h-9" />}
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-800 break-normal whitespace-nowrap">
                      {file ? file.name : 'Drop file here'}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-black tracking-widest">Max 5MB • PDF / DOC / IMG</p>
                  </div>

                  {file && (
                    <button onClick={e => { e.stopPropagation(); setFile(null) }} className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-black shadow-lg z-20 hover:scale-110 transition-transform">×</button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 p-8 text-center text-slate-400">
              <div className="flex justify-center mb-3"><IconLock className="w-10 h-10 text-slate-300" /></div>
              <p className="text-sm font-black uppercase tracking-wider text-slate-400 mb-1">Upload Attachment Locked</p>
              <p className="text-xs text-slate-400/80 font-medium">
                {progressPending ? 'Unlocks again once your current update is reviewed.' : 'Unlocks after your commitment is Approved.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <ActivityModal item={selectedActivity} onClose={() => setSelectedActivity(null)} />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Ready to Leave?"
        message="Are you sure you want to log out of your commitment dashboard?"
        confirmText="Logout"
        cancelText="Stay Here"
        type="danger"
        onConfirm={logout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      {showGuideline && <UserGuideline onClose={handleCloseGuideline} />}
    </div>
  )
}
