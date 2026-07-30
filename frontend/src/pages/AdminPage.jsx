import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api, { getAssetURL } from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import SummaryStats from '../components/SummaryStats'
import treeImg from '../asset/Pohon 10.png'
import ConfirmModal from '../components/ConfirmModal'
import DeclineModal from '../components/DeclineModal'
import AdminGuideline from '../components/AdminGuideline'
import { getEffectiveStatus, getStatusPriority } from '../utils/status'
import { IconWave, IconDownload, IconHistory, IconDocument, IconCheck, IconWarning, IconClose, IconTrash, IconPlus, IconUsers } from '../components/icons'

const STATUSES = [
  { value: 'All', label: 'All' },
  { value: 'No Submission', label: 'No Submission' },
  { value: 'On Review', label: 'On Review' },
  { value: 'Accepted', label: 'Approved' },
  { value: 'Rejected', label: 'Declined' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Achieved', label: 'Achieved' },
]

export default function AdminPage() {
  const { user, logout } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [data, setData] = useState([])
  const [saving, setSaving] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [declineTarget, setDeclineTarget] = useState(null) // { id, type: 'commitment' | 'progress' }
  const [approveTarget, setApproveTarget] = useState(null) // { id, type: 'commitment' | 'progress' }
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }
  const [showGuideline, setShowGuideline] = useState(false)
  const [historyUserId, setHistoryUserId] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [manageUsersOpen, setManageUsersOpen] = useState(false)
  const [manageUserSearch, setManageUserSearch] = useState('')
  const [addUserForm, setAddUserForm] = useState({ name: '', pin: '', heart_value: '' })
  const [addUserError, setAddUserError] = useState('')
  const [addUserSaving, setAddUserSaving] = useState(false)

  useEffect(() => {
    if (historyUserId) {
      setLoadingHistory(true)
      api.get(`/admin/commitments/${historyUserId}/history`)
        .then(r => setHistoryData(r.data))
        .catch(e => console.error(e))
        .finally(() => setLoadingHistory(false))
    } else {
      setHistoryData([])
    }
  }, [historyUserId])

  const handleExportExcel = async () => {
    const { exportStyledExcel } = await import('../utils/exportExcel')
    exportStyledExcel({
      filename: 'User_Commitments_Report.xlsx',
      sheetName: 'User Commitments',
      columns: [
        { header: 'No', key: 'no' },
        { header: 'Name', key: 'name' },
        { header: 'Division/Heart Value', key: 'heart_value' },
        { header: 'My Commitment', key: 'commitment' },
        { header: 'Status', key: 'status' },
        { header: 'Review Status', key: 'review_status' },
        { header: 'Deskripsi Progress', key: 'challenges' },
        { header: 'Measurable Impact', key: 'impact' },
        { header: 'Attachment', key: 'attachment' },
      ],
      rows: visibleData.map((row, idx) => ({
        no: idx + 1,
        name: row.name,
        heart_value: row.heart_value || '—',
        commitment: row.initial_commitment || 'No commitment submitted yet.',
        status: getEffectiveStatus(row),
        review_status: row.review_status === 'Accepted' ? 'Approved' : row.review_status === 'Rejected' ? 'Declined' : (row.review_status || 'No Submission'),
        challenges: row.latest_challenges || '—',
        impact: row.measurable_impact || '—',
        attachment: row.latest_attachment_url
          ? { text: 'View Attachment', hyperlink: `${window.location.origin}${getAssetURL(row.latest_attachment_url)}` }
          : '—',
      })),
    })
  }

  const fetchData = () => api.get('/admin/commitments').then(r => setData(r.data))
  useEffect(() => { fetchData() }, [])

  const visibleData = data.filter(d => !d.is_admin)

  const filtered = visibleData
    .filter(d => statusFilter === 'All' || getEffectiveStatus(d) === statusFilter)
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => getStatusPriority(a) - getStatusPriority(b) || a.name.localeCompare(b.name))

  const handleReview = async (id, type, review_status, reason = null) => {
    if (review_status === 'Rejected' && !reason) {
      setDeclineTarget({ id, type })
      return
    }
    setSaving(true)
    try {
      if (type === 'progress') {
        await api.patch(`/admin/progress-update/${id}`, { progress_status: review_status, review_reason: reason })
      } else {
        await api.patch(`/admin/progress/${id}`, { review_status, review_reason: reason })
      }
      fetchData()
      setDeclineTarget(null)
      setApproveTarget(null)
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update review status.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`)
      fetchData()
      setDeleteTarget(null)
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete user.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddUser = async () => {
    setAddUserError('')
    if (!addUserForm.name.trim() || !/^\d{4}$/.test(addUserForm.pin)) {
      setAddUserError('Name and a 4-digit PIN are required.')
      return
    }
    setAddUserSaving(true)
    try {
      await api.post('/admin/users', addUserForm)
      setAddUserForm({ name: '', pin: '', heart_value: '' })
      fetchData()
    } catch (e) {
      setAddUserError(e.response?.data?.message || 'Failed to add user.')
    } finally {
      setAddUserSaving(false)
    }
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
              <p className="text-white/70 text-xs font-medium tracking-tight">Commitment Review · Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/90 text-sm font-semibold bg-white/10 px-3 py-1 rounded-full hidden sm:flex items-center gap-1.5">Hi, {user?.name} <IconWave className="w-4 h-4" /></span>
            <button onClick={() => setShowGuideline(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition" title="Show Guideline">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button onClick={() => setIsLogoutModalOpen(true)} className="text-white/70 text-xs font-black uppercase tracking-widest hover:text-white transition-all ml-2">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-[98%] mx-auto px-4 py-6 space-y-4">
        <SummaryStats data={data} />

        {/* Search & Status Filter */}
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
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 items-center w-full">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setManageUsersOpen(true)}
              className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand text-white hover:bg-brand-dark shadow-md transition-all flex items-center gap-2">
              <IconUsers className="w-3.5 h-3.5" /> Manage Users
            </button>
            <button onClick={handleExportExcel}
              className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all flex items-center gap-2">
              <IconDownload className="w-3.5 h-3.5" /> Export Commitments
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest w-10">#</th>
                  <th className="px-4 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest min-w-[120px]">Name</th>
                  <th className="px-4 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest min-w-[220px]">Commitment</th>
                  <th className="px-4 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest w-24">Attachment</th>
                  <th className="px-4 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest w-28">Status</th>
                  <th className="px-4 py-4 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest min-w-[160px] max-w-[220px]">Deskripsi Progress</th>
                  <th className="px-4 py-4 text-center font-black text-slate-400 uppercase text-[10px] tracking-widest w-48">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row, index) => {
                  const pendingCommitment = row.review_status === 'On Review'
                  const pendingProgress = row.review_status === 'Accepted' && row.progress_status === 'On Review'
                  const progressDeclined = row.review_status === 'Accepted' && row.progress_status === 'Rejected'
                  return (
                  <tr key={row.id} className={`hover:bg-slate-50/50 transition-colors
                    ${!row.review_status ? 'opacity-60' : ''}
                    ${pendingCommitment || pendingProgress ? 'bg-yellow-50/30' : row.review_status === 'Rejected' || progressDeclined ? 'bg-red-50/20' : ''}`}>
                    <td className="px-4 py-4 text-slate-400 font-bold text-[11px]">{index + 1}</td>
                    <td className="px-4 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="px-4 py-4 min-w-[220px]">
                      <div className="flex flex-col gap-2">
                        <p className="text-slate-600 text-xs leading-relaxed italic line-clamp-2">
                          {row.initial_commitment
                            ? `"${row.initial_commitment}"`
                            : <span className="text-slate-300 not-italic">No commitment submitted yet.</span>
                          }
                        </p>
                        <div>
                          <button onClick={() => setHistoryUserId(row.id)} className="text-[10px] font-black text-brand bg-brand/5 border border-brand/10 px-2.5 py-1.5 rounded-lg hover:bg-brand/10 transition-all flex items-center gap-1.5 w-fit">
                            <IconHistory className="w-3.5 h-3.5" /> History
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {row.latest_attachment_url ? (
                        <a href={getAssetURL(row.latest_attachment_url)} target="_blank" className="flex items-center gap-1.5 text-brand hover:text-brand-dark font-black text-[10px] uppercase tracking-widest transition-colors">
                          <IconDocument className="w-4 h-4" /> View
                        </a>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={getEffectiveStatus(row)} /></td>
                    <td className="px-4 py-4 max-w-[220px]">
                      <p className="text-[11px] font-bold text-slate-500 line-clamp-2 italic">
                        {row.latest_challenges || <span className="text-slate-300 font-medium">—</span>}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {pendingCommitment ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">New Commitment</span>
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => setApproveTarget({ id: row.id, type: 'commitment' })} className="bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-green-600 transition-all shadow-md shadow-green-200">Approve</button>
                            <button onClick={() => setDeclineTarget({ id: row.id, type: 'commitment' })} className="bg-white border-2 border-red-100 text-red-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-50 transition-all">Decline</button>
                          </div>
                        </div>
                      ) : pendingProgress ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Update: {row.status}</span>
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => setApproveTarget({ id: row.id, type: 'progress' })} className="bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-green-600 transition-all shadow-md shadow-green-200">Approve</button>
                            <button onClick={() => setDeclineTarget({ id: row.id, type: 'progress' })} className="bg-white border-2 border-red-100 text-red-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-50 transition-all">Decline</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border
                             ${row.review_status === 'Accepted' && !progressDeclined ? 'bg-green-50 text-green-700 border-green-100'
                              : row.review_status === 'Rejected' || progressDeclined ? 'bg-red-50 text-red-700 border-red-100'
                                : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                            {row.review_status === 'Accepted' && !progressDeclined ? <><IconCheck className="w-3 h-3" /> APPROVED</>
                              : row.review_status === 'Rejected' ? <><IconWarning className="w-3 h-3" /> DECLINED</>
                                : progressDeclined ? <><IconWarning className="w-3 h-3" /> UPDATE DECLINED</>
                                  : 'NO SUBMISSION'}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DeclineModal
        isOpen={!!declineTarget}
        onClose={() => setDeclineTarget(null)}
        onConfirm={(reason) => handleReview(declineTarget.id, declineTarget.type, 'Rejected', reason)}
        saving={saving}
      />

      <ConfirmModal
        isOpen={!!approveTarget}
        title="Approve this submission?"
        message={approveTarget?.type === 'progress'
          ? 'This will confirm the progress update as official and visible.'
          : 'The employee will be able to start tracking progress right after this.'}
        confirmText="Approve"
        cancelText="Cancel"
        type="primary"
        onConfirm={() => handleReview(approveTarget.id, approveTarget.type, 'Accepted')}
        onCancel={() => setApproveTarget(null)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete this user?"
        message={`This permanently removes ${deleteTarget?.name || 'this user'} and their entire commitment history. This cannot be undone.`}
        confirmText={saving ? 'Deleting...' : 'Delete User'}
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteTarget(null)}
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

      {/* Manage Users Modal — add + delete, one place */}
      {manageUsersOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setManageUsersOpen(false)}>
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-8 pt-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Manage Users</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Add new employees or remove existing ones.</p>
              </div>
              <button onClick={() => setManageUsersOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><IconClose className="w-5 h-5" /></button>
            </div>

            {/* Add New User */}
            <div className="px-8 pt-6 space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Add New User</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text" value={addUserForm.name}
                  onChange={e => setAddUserForm(f => ({ ...f, name: e.target.value }))}
                  className="col-span-2 border-2 border-slate-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand bg-slate-50 transition-all"
                  placeholder="Employee full name"
                />
                <input
                  type="text" inputMode="numeric" maxLength={4} value={addUserForm.pin}
                  onChange={e => setAddUserForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                  className="border-2 border-slate-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand bg-slate-50 transition-all"
                  placeholder="4-digit PIN"
                />
                <input
                  type="text" value={addUserForm.heart_value}
                  onChange={e => setAddUserForm(f => ({ ...f, heart_value: e.target.value }))}
                  className="border-2 border-slate-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand bg-slate-50 transition-all"
                  placeholder="Heart Value / Division"
                />
              </div>
              {addUserError && <p className="text-[11px] text-red-500 font-bold bg-red-50 p-2.5 rounded-lg">{addUserError}</p>}
              <button onClick={handleAddUser} disabled={addUserSaving} className="w-full py-3 bg-brand text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2">
                <IconPlus className="w-3.5 h-3.5" /> {addUserSaving ? 'Adding...' : 'Add User'}
              </button>
            </div>

            <div className="h-px bg-slate-100 mx-8 mt-6" />

            {/* Existing Users — search + delete */}
            <div className="px-8 pt-4 pb-2">
              <input
                type="text" placeholder="Search users to remove..." value={manageUserSearch}
                onChange={e => setManageUserSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
            <div className="px-8 pb-8 overflow-y-auto flex-1 space-y-1">
              {visibleData
                .filter(u => u.name.toLowerCase().includes(manageUserSearch.toLowerCase()))
                .map(u => (
                  <div key={u.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">PIN {u.pin} {u.heart_value ? `· ${u.heart_value}` : ''}</p>
                    </div>
                    <button onClick={() => setDeleteTarget({ id: u.id, name: u.name })} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0" title="Delete User">
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              {visibleData.filter(u => u.name.toLowerCase().includes(manageUserSearch.toLowerCase())).length === 0 && (
                <p className="text-center py-6 text-slate-300 text-xs italic font-medium">No users found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setHistoryUserId(null)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Activity & Status History</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {data.find(d => d.id === historyUserId)?.name}'s Timeline
                </p>
              </div>
              <button onClick={() => setHistoryUserId(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><IconClose className="w-4 h-4" /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {loadingHistory ? (
                <div className="text-center py-10 text-slate-400 font-semibold text-xs">Loading history...</div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-10 text-slate-350 italic text-xs">No previous submissions found in log.</div>
              ) : (
                <div className="space-y-6">
                  {historyData.map((h, i) => {
                    const olderEntry = historyData[i + 1]
                    const isFirstEver = i === historyData.length - 1
                    const textChanged = isFirstEver || h.commitment_text !== olderEntry?.commitment_text
                    return (
                    <div key={h.id || i} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={h.status} />
                        <div className="text-[10px] font-bold text-slate-400">{new Date(h.created_at).toLocaleString()}</div>
                      </div>
                      {textChanged && (
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            {isFirstEver ? 'Commitment Text' : 'Commitment Text Revised'}
                          </span>
                          <p className="text-xs font-bold leading-relaxed text-slate-800 italic bg-white p-3 rounded-xl border border-slate-100 shadow-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                            "{h.commitment_text || '—'}"
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Action By</span>
                        <p className="mt-1 text-xs font-black text-slate-700">{h.updated_by_name} ({h.updated_by_role})</p>
                      </div>
                      {h.attachment_url && (
                        <a href={getAssetURL(h.attachment_url)} target="_blank" className="inline-flex items-center gap-1.5 text-[10px] font-black text-brand uppercase tracking-widest hover:text-brand-dark transition-colors">
                          <IconDocument className="w-3.5 h-3.5" /> View Attachment
                        </a>
                      )}
                      {h.challenges && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mt-2 max-h-64 overflow-y-auto">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Deskripsi Progress</span>
                          <p className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{h.challenges}</p>
                        </div>
                      )}
                      {((h.status === 'REJECTED' || h.status === 'DECLINED' || h.status === 'PROGRESS_REJECTED') && h.measurable_impact) && (
                        <div className="bg-red-50/40 border border-red-100 rounded-xl p-3.5 mt-2 max-h-64 overflow-y-auto">
                          <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block mb-1">Decline Comment</span>
                          <p className="text-xs font-medium text-red-700 leading-relaxed whitespace-pre-wrap">
                            {h.measurable_impact.replace('Commitment Declined: ', '').replace('Commitment Rejected: ', '').replace('Review Declined: ', '').replace('Progress Update Declined: ', '')}
                          </p>
                        </div>
                      )}
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
