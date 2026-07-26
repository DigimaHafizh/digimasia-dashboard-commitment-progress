import { IconClock, IconCircleDashed, IconCheck, IconClipboard, IconWarning, IconCircle } from './icons'

const STATUS_MAP = {
  'On Review': { cls: 'status-on-review', Icon: IconClock, label: 'On Review' },
  'ON_REVIEW': { cls: 'status-on-review', Icon: IconClock, label: 'On Review' },
  'SUBMITTED': { cls: 'status-on-review', Icon: IconClipboard, label: 'Submitted' },
  'In Progress': { cls: 'status-in-progress', Icon: IconCircleDashed, label: 'In Progress' },
  'IN_PROGRESS': { cls: 'status-in-progress', Icon: IconCircleDashed, label: 'In Progress' },
  'Achieved': { cls: 'status-achieved', Icon: IconCheck, label: 'Achieved' },
  'ACHIEVED': { cls: 'status-achieved', Icon: IconCheck, label: 'Achieved' },
  'Accepted': { cls: 'status-accepted', Icon: IconCheck, label: 'Approved' },
  'APPROVED': { cls: 'status-accepted', Icon: IconCheck, label: 'Approved' },
  'PROGRESS_APPROVED': { cls: 'status-accepted', Icon: IconCheck, label: 'Progress Approved' },
  'Rejected': { cls: 'status-declined', Icon: IconWarning, label: 'Declined' },
  'REJECTED': { cls: 'status-declined', Icon: IconWarning, label: 'Declined' },
  'DECLINED': { cls: 'status-declined', Icon: IconWarning, label: 'Declined' },
  'PROGRESS_REJECTED': { cls: 'status-declined', Icon: IconWarning, label: 'Progress Declined' },
}

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status]
  const cls = s?.cls ?? 'status-on-review'
  const Icon = s?.Icon ?? IconCircle
  const label = s?.label ?? (status || 'No Commitment Yet')
  return (
    <span className={`status-badge whitespace-nowrap ${cls}`}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      {label}
    </span>
  )
}
