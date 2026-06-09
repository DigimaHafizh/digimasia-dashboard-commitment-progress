import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import ReviewTooltip from '../components/ReviewTooltip'
import * as XLSX from 'xlsx'

export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [filter, setFilter] = useState('All')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = () => api.get('/admin/commitments').then(r => setData(r.data))
  useEffect(() => { fetchData() }, [])

  const filtered = (filter === 'Needs Review'
    ? data.filter(d => d.review_reason)
    : data
  ).filter(d => !d.is_admin)

  const startEdit = (row) => { setEditId(row.id); setEditText(row.initial_commitment || '') }
  const cancelEdit = () => { setEditId(null); setEditText('') }

  const saveEdit = async (id) => {
    setSaving(true)
    try {
      await api.patch(`/admin/commitments/${id}`, { initial_commitment: editText })
      fetchData(); cancelEdit()
    } finally { setSaving(false) }
  }

  const exportExcel = async () => {
    const { data: history } = await api.get('/admin/progress-history')
    const ws = XLSX.utils.json_to_sheet(history)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Progress History')
    XLSX.writeFile(wb, 'Commitment_Progress_Report.xlsx')
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-gradient-to-r from-brand-dark to-brand shadow-lg border-b-4 border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0">
              <img src="/src/asset/Pohon 10.png" alt="Tree" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-lg leading-tight drop-shadow">Admin Panel</h1>
              <p className="text-white/70 text-xs font-medium">Commitment Management · Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/20 transition shadow-sm">View Dashboard</button>
            <button onClick={logout} className="text-white/70 text-xs font-medium hover:text-white transition">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['All', 'Needs Review'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition
                ${filter === f ? 'bg-brand text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
              {f === 'Needs Review' ? '⚠️ Needs Review' : f}
              {f === 'Needs Review' && <span className="ml-2 bg-warning text-white text-xs px-1.5 py-0.5 rounded-full">{data.filter(d => d.review_reason).length}</span>}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Commitment</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Review Reason</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(row => (
                  <tr key={row.id} className={`hover:bg-slate-50 transition ${row.review_reason ? 'bg-yellow-50/30' : ''}`}>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {row.name}
                        {row.review_reason && <ReviewTooltip reason={row.review_reason} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {editId === row.id ? (
                        <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                          className="w-full border border-brand rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
                      ) : (
                        <p className="text-slate-600 text-xs">{row.initial_commitment || <span className="italic text-slate-400">Empty</span>}</p>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3 text-xs text-warning font-semibold">{row.review_reason || '—'}</td>
                    <td className="px-4 py-3">
                      {editId === row.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(row.id)} disabled={saving} className="bg-success text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">Save</button>
                          <button onClick={cancelEdit} className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-300">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(row)} className="bg-brand/10 text-brand text-xs px-3 py-1.5 rounded-lg hover:bg-brand/20 font-semibold">Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
