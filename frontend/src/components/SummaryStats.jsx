import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#94A3B8', '#F59E0B', '#10B981']
const STATUSES = ['Not Started', 'In Progress', 'Achieved']

export default function SummaryStats({ data }) {
  const employees = useMemo(() => data.filter(d => !d.is_admin), [data])
  const stats = useMemo(() => STATUSES.map(s => ({
    name: s,
    value: employees.filter(d => d.status === s).length
  })), [employees])

  const total = employees.length

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col sm:flex-row items-center gap-6">
      <div className="w-48 h-48 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={stats} cx="50%" cy="50%" innerRadius={50} outerRadius={76} paddingAngle={3} dataKey="value">
              {stats.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip formatter={(v) => [`${v} (${total ? Math.round(v / total * 100) : 0}%)`, '']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-4 w-full">
        {stats.map((s, i) => (
          <div key={s.name} className="text-center">
            <p className="text-2xl font-bold" style={{ color: COLORS[i] }}>{s.value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">{s.name}</p>
            <p className="text-xs text-slate-400">{total ? Math.round(s.value / total * 100) : 0}% of {total}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
