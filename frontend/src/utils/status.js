// Folds review_status + progress status into one label so every view agrees
// on what a row's "current state" is: On Review > Rejected > Accepted (+ progress) > No Submission.
export function getEffectiveStatus(row) {
  if (row.review_status === 'On Review') return 'On Review'
  if (row.review_status === 'Rejected') return 'Rejected'
  if (row.review_status === 'Accepted') return row.status || 'Accepted'
  return 'No Submission'
}

// Sort weight so tables surface rows that need attention first, and push
// untouched "No Submission" rows to the bottom instead of mixing alphabetically.
const STATUS_PRIORITY = {
  'On Review': 0,
  'Rejected': 1,
  'Accepted': 2,
  'In Progress': 3,
  'Achieved': 4,
  'No Submission': 5,
}

export function getStatusPriority(row) {
  return STATUS_PRIORITY[getEffectiveStatus(row)] ?? 99
}
