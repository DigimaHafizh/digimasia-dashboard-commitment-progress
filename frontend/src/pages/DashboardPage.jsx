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
import ConfirmModal from '../components/ConfirmModal'
import treeImg from '../asset/Pohon 10.png'

const STATUSES = ['All', 'Not Started', 'In Progress', 'Achieved']

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [adminUpdateUser, setAdminUpdateUser] = useState(null)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

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
      <nav className="bg-gradient-to-r from-brand-dark to-brand shadow-lg border-b-4 border-white/20 sticky top-0 z-10">
        <div className="max-w-[98%] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0">
              <img src={treeImg} alt="Tree" className="w-full h-full object-contain drop-shadow-md" />
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
            <button onClick={() => setIsLogoutModalOpen(true)} className="text-white/70 text-xs font-black uppercase tracking-widest hover:text-white transition-all ml-2">Logout</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[98%] mx-auto px-4 py-6 space-y-6">
        <SummaryStats data={data} />

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3 border border-slate-200">
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

        {/* Data Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 font-medium">Loading commitments...</div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest whitespace-nowrap w-16">#</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest whitespace-nowrap w-48">Collaborator</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest min-w-[400px]">Commitment Detail</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest whitespace-nowrap w-40">Status</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest whitespace-nowrap w-40">Review Status</th>
                  <th className="px-6 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest min-w-[400px]">Measurable Impact</th>
                  <th className="px-6 py-4 text-center font-black text-slate-400 uppercase text-[10px] tracking-widest whitespace-nowrap w-56">Action Area</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-24 text-center text-gray-400 font-medium">No matching records found.</td></tr>
                ) : filtered.map((row, i) => (
                  <tr key={row.id} className={`hover:bg-slate-50/50 transition-colors ${row.review_status === 'Declined' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-5 text-slate-400 font-bold text-[11px]">{i + 1}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 group/name relative">
                        <span className="font-bold text-slate-900 tracking-tight text-sm leading-tight break-words max-w-[170px]">
                          {row.name}
                        </span>
                        {(row.review_reason || row.review_status === 'Declined' || !row.initial_commitment) && (
                          <div className="flex-shrink-0">
                            <ReviewTooltip reason={row.review_reason || (!row.initial_commitment ? 'NULL' : null)} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-slate-600 text-xs leading-relaxed italic">
                        {row.initial_commitment ? `"${row.initial_commitment}"` : <span className="text-slate-300 font-normal not-italic">No commitment defined yet.</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap"><StatusBadge status={row.status} /></td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {(row.review_status?.toLowerCase() === 'accepted' || row.review_status?.toLowerCase() === 'approved') ? (
                        <span className="bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-green-100">✓ Approved</span>
                      ) : row.review_status?.toLowerCase() === 'declined' ? (
                        <span className="bg-red-50 text-red-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-red-100 animate-pulse">✖ Declined</span>
                      ) : (
                        <span className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-100">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-slate-600 text-xs font-bold leading-relaxed">
                      {row.measurable_impact || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      {user?.id === row.id ? (
                        <div className="px-4">
                          <button onClick={() => navigate('/update')} className="bg-brand text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-all shadow-lg shadow-brand/10 w-full whitespace-nowrap">
                            Update Progress
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-200 text-[10px] font-black uppercase tracking-tighter">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
