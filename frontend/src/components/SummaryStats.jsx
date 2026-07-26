import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { getEffectiveStatus } from '../utils/status'

// Every possible effective status, so the breakdown always sums to the true total headcount
const STATUSES = [
  { name: 'No Submission', color: '#94A3B8' },
  { name: 'On Review', color: '#3B82F6' },
  { name: 'Rejected', color: '#EF4444' },
  { name: 'Accepted', color: '#A855F7' },
  { name: 'In Progress', color: '#F59E0B' },
  { name: 'Achieved', color: '#10B981' },
]

export default function SummaryStats({ data }) {
  const employees = useMemo(() => data.filter(d => !d.is_admin), [data])

  const stats = useMemo(() => STATUSES.map(s => ({
    ...s,
    value: employees.filter(d => getEffectiveStatus(d) === s.name).length
  })), [employees])

  const total = employees.length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Expansive Main Chart Card */}
      <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl border border-slate-200 p-8 flex flex-col items-center justify-center relative overflow-hidden group">
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/5 rounded-full blur-3xl group-hover:bg-brand/10 transition-all duration-700"></div>

        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Commitment Status Summary</h3>

        <div className="w-full h-56 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats} cx="50%" cy="50%"
                innerRadius={70} outerRadius={100}
                paddingAngle={stats.filter(s => s.value > 0).length > 1 ? 4 : 0}
                dataKey="value"
                stroke="none"
              >
                {stats.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '12px 16px' }}
                itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                cursor={{ fill: 'transparent' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-5xl font-black text-slate-800 tracking-tighter leading-none">{total}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 bg-slate-100 px-3 py-1 rounded-full">Total Commitment</span>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Grid — all 6 effective statuses */}
      <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.name} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] block mb-1">{s.name}</span>
                <p className="text-3xl font-black text-slate-800 tracking-tighter">{s.value}</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <span className="text-[9px] font-black text-slate-500 uppercase">{total ? Math.round(s.value / total * 100) : 0}%</span>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ width: `${total ? (s.value / total) * 100 : 0}%`, backgroundColor: s.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
