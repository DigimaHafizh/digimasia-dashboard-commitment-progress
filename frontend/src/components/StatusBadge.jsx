const STATUS_MAP = {
  'Not Started': { cls: 'status-not-started', icon: '○' },
  'In Progress': { cls: 'status-in-progress', icon: '◑' },
  'Achieved': { cls: 'status-achieved', icon: '✓' },
  'In Review': { cls: 'status-in-review', icon: '◷' },
  'APPROVED': { cls: 'status-achieved', icon: '✓' },
  'DECLINED': { cls: 'status-declined', icon: '✖' },
}
export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { cls: 'status-not-started', icon: '○' }
  return <span className={`status-badge whitespace-nowrap ${s.cls}`}>{s.icon} {status || 'Not Started'}</span>
}
