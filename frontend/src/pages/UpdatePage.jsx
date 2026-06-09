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
  const [adminBanner, setAdminBanner] = useState(null)
  const [success, setSuccess] = useState('')
  const [selectedActivity, setSelectedActivity] = useState(null)

  useEffect(() => {
    api.get('/commitments/me').then(r => {
      setForm(r.data)
      setStatus(r.data.status || 'Not Started')
      setImpact(r.data.measurable_impact || '')
      setChallenges(r.data.challenges || '')
      setCommitment(r.data.initial_commitment || '')
      setAdminBanner(r.data.admin_revision_banner)
    })
    api.get('/commitments/me/history').then(r => setHistory(r.data))
  }, [])

  const handleSave = async () => {
    setSaving(true); setSuccess('')
    try {
      await api.patch('/commitments/me', {
        status,
        challenges: status !== 'Achieved' ? challenges : null,
        measurable_impact: status === 'Achieved' ? impact : null,
        initial_commitment: form?.review_reason === 'NEW_USER' ? commitment : undefined,
      })
      const [updated, hist] = await Promise.all([
        api.get('/commitments/me'),
        api.get('/commitments/me/history')
      ])
      setForm(updated.data); setHistory(hist.data)
      setSuccess('Your progress has been saved successfully! ✅')
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save. Please try again.')
    } finally { setSaving(false) }
  }

  if (!form) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading your commitment...</div>

  const isDirty = status !== (form.status || 'Not Started') ||
    challenges !== (form.challenges || '') ||
    impact !== (form.measurable_impact || '') ||
    (form.review_reason === 'NEW_USER' && commitment !== (form.initial_commitment || ''));

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-brand hover:underline text-sm">← Back to Dashboard</button>
          <h1 className="text-xl font-bold text-slate-800">Update My Commitment Progress</h1>
        </div>

        {/* Admin revision banner */}
        {adminBanner && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-sm text-yellow-800">
            ℹ️ <strong>Your commitment has been updated by {adminBanner.admin_name}</strong> on {new Date(adminBanner.revised_at).toLocaleString()}.
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          {/* Name (readonly) */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</label>
            <p className="mt-1 font-semibold text-slate-800">{user?.name}</p>
          </div>

          {/* Commitment — readonly unless NEW_USER */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
              My 6-Month Commitment
              {form.review_reason === 'NEW_USER' && <span className="ml-2 text-warning">⚠️ Please enter your commitment below</span>}
            </label>
            {form.review_reason === 'NEW_USER' ? (
              <textarea
                value={commitment} onChange={e => setCommitment(e.target.value)} rows={3}
                placeholder="Describe your measurable 6-month commitment aligned to HEART values..."
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            ) : (
              <p className="text-slate-700 bg-slate-50 rounded-lg p-3 text-sm">{form.initial_commitment || '—'}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Current Status</label>
            <div className="flex gap-3">
              {STATUS_OPTIONS.map(s => (
                <label key={s} className={`flex-1 cursor-pointer border-2 rounded-xl p-3 text-center text-sm font-semibold transition
                  ${status === s ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 text-gray-500 hover:border-brand/40'}`}>
                  <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
                  {s}
                </label>
              ))}
            </div>
          </div>

          {/* Conditional: Challenges (Not Started / In Progress) */}
          {(status === 'Not Started' || status === 'In Progress') && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Obstacles / Challenges Faced</label>
              <textarea
                value={challenges} onChange={e => setChallenges(e.target.value)} rows={4}
                placeholder="Describe the main obstacles or challenges you are currently facing..."
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
              <p className="text-xs text-slate-400 mt-1">🔒 This response is private and will not appear on the public dashboard.</p>
            </div>
          )}

          {/* Conditional: Measurable Impact (Achieved) */}
          {status === 'Achieved' && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Measurable Impact</label>
              <textarea
                value={impact} onChange={e => setImpact(e.target.value)} rows={4}
                placeholder="e.g. 'Reduced response time by 30% in Q2, resulting in 2 client escalations avoided...' Be specific and quantify your impact."
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
          )}

          {success && <p className="text-success text-sm font-semibold">{success}</p>}
          <button
            onClick={handleSave} disabled={saving || !isDirty}
            className="w-full py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Progress Update'}
          </button>
        </div>

        {/* Activity History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-slate-700 mb-4">My Activity Timeline</h2>
            <ol className="relative border-l border-slate-200 space-y-4 pl-4">
              {history.map(h => (
                <li key={h.id} className="text-sm p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition" onClick={() => setSelectedActivity(h)}>
                  <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-brand border-2 border-white" />
                  <p className="text-xs text-slate-500 font-semibold mb-1">
                    Your commitment has been updated by <span className="text-brand">{h.updated_by_role === 'Admin' ? '[Admin] ' + h.updated_by_name : (h.updated_by_name || 'You')}</span> on <span className="text-slate-600">{new Date(h.created_at).toLocaleString()}</span>
                  </p>
                  <StatusBadge status={h.status} />
                  {h.measurable_impact && <p className="mt-1 text-slate-600 truncate">Impact: {h.measurable_impact}</p>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <ActivityModal item={selectedActivity} onClose={() => setSelectedActivity(null)} />
    </div>
  )
}
