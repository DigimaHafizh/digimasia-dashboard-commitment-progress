import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import SummaryStats from '../components/SummaryStats'
import ReviewTooltip from '../components/ReviewTooltip'
import NotificationBell from '../components/NotificationBell'
import AdminUpdateModal from '../components/AdminUpdateModal'
import UserGuideline from '../components/UserGuideline'

const STATUSES = ['All', 'Not Started', 'In Progress', 'Achieved']

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [adminUpdateUser, setAdminUpdateUser] = useState(null)

  const [showGuideline, setShowGuideline] = useState(() => {
    return localStorage.getItem(`has_seen_guidelined_${user?.id}`) !== 'true'
  })

  const fetchData = () => {
    api.get('/commitments').then(r => setData(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = useMemo(() =>
    data.filter(r =>
      !r.is_admin &&
      (statusFilter === 'All' || r.status === statusFilter) &&
      r.name.toLowerCase().includes(search.toLowerCase())
    ), [data, search, statusFilter])

  const handleCloseGuideline = () => {
    localStorage.setItem(`has_seen_guidelined_${user?.id}`, 'true')
    setShowGuideline(false)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-dark to-brand shadow-lg border-b-4 border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0">
              <img src="/src/asset/Pohon 10.png" alt="Tree" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-lg leading-tight drop-shadow">Commitment Progress Dashboard</h1>
              <p className="text-white/70 text-xs font-medium">X-Traordinary · Grow With Heart</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/90 text-sm font-semibold bg-white/10 px-3 py-1 rounded-full hidden sm:block">Hi, {user?.name} 👋</span>
            <button onClick={() => setShowGuideline(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition" title="Show Guideline">
              ❓
            </button>
            <NotificationBell />
            {user?.is_admin && (
              <button onClick={() => navigate('/admin')} className="bg-white text-brand text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-brand-light hover:text-white transition shadow-sm">Admin Panel</button>
            )}
            <button onClick={logout} className="text-white/70 text-xs font-medium hover:text-white transition">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Stats */}
        <SummaryStats data={data} />

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text" placeholder="Search by name..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          >
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">Loading commitments...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Commitment</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Measurable Impact</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center text-gray-400">No results found.</td></tr>
                  ) : filtered.map((row, i) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {row.name}
                          {row.review_reason && <ReviewTooltip reason={row.review_reason} />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">{row.initial_commitment || <span className="italic text-slate-400">—</span>}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3 text-slate-600 max-w-sm text-xs">{row.measurable_impact || <span className="italic text-slate-400">—</span>}</td>
                      <td className="px-4 py-3 text-center">
                        {user?.id === row.id ? (
                          <button onClick={() => navigate('/update')} className="bg-brand text-white text-xs px-3 py-1.5 rounded-lg hover:bg-brand-dark transition font-semibold w-full">Update</button>
                        ) : (
                          <span className="text-slate-300 italic text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {adminUpdateUser && (
        <AdminUpdateModal
          userToEdit={adminUpdateUser}
          onClose={() => setAdminUpdateUser(null)}
          onSuccess={() => { setAdminUpdateUser(null); fetchData(); }}
        />
      )}

      {showGuideline && <UserGuideline onClose={handleCloseGuideline} />}
    </div>
  )
}
