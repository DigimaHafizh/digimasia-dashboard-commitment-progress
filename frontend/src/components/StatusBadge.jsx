const STATUS_MAP = {
  'Not Started': { cls: 'status-not-started', icon: '○' },
  'In Progress': { cls: 'status-in-progress', icon: '◑' },
  'Achieved':    { cls: 'status-achieved',    icon: '✓' },
}
export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { cls: 'status-not-started', icon: '○' }
  return <span className={`status-badge ${s.cls}`}>{s.icon} {status || 'Not Started'}</span>
}
