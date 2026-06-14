import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#94A3B8', '#F59E0B', '#10B981']
const STATUSES = ['Not Started', 'In Progress', 'Achieved']

export default function SummaryStats({ data }) {
  const employees = useMemo(() => data.filter(d => !d.is_admin), [data])

  // Filter stats to only show the 3 main statuses (removing 'In Review')
  const stats = useMemo(() => STATUSES.map(s => ({
    name: s,
    value: employees.filter(d => d.status === s).length
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
                paddingAngle={stats.filter(s => s.value > 0).length > 1 ? 8 : 0}
                dataKey="value"
                stroke="none"
              >
                {stats.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
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

      {/* Detailed Breakdown Grid - Adjusted for 3 cards */}
      <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={s.name} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${COLORS[i]}15` }}>
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: COLORS[i] }} />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] block mb-1">{s.name}</span>
                <p className="text-4xl font-black text-slate-800 tracking-tighter">{s.value}</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase">{total ? Math.round(s.value / total * 100) : 0}% Engagement Level</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ width: `${total ? (s.value / total) * 100 : 0}%`, backgroundColor: COLORS[i] }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
