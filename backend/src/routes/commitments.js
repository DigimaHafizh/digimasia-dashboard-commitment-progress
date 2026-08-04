import { Router } from 'express'
import { pool } from '../db/pool.js'
import { authMiddleware } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = 'uploads/'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10)
    const safeBase = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60)
    cb(null, `${Date.now()}-${safeBase}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type. Only PDF, DOC/DOCX, and images are allowed.'))
    }
    cb(null, true)
  }
})

const router = Router()

// Valid progress statuses (v2.1: removed 'Not Started')
const VALID_STATUSES = ['In Progress', 'Achieved']

// Get my own commitment (with challenges + admin review comment)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
    const user = rows[0]
    res.json(user)
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Get my history
router.get('/me/history', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM progress_log WHERE user_id = ? ORDER BY created_at DESC
    `, [req.user.id])
    res.json(rows)
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Update my progress (v2.1 rules)
router.patch('/me', authMiddleware, upload.single('attachment'), async (req, res) => {
  const { status, challenges, measurable_impact, initial_commitment } = req.body
  try {
    const { rows: currentRows } = await pool.query(
      'SELECT status, initial_commitment, review_status, progress_status, commitment_locked FROM users WHERE id = ?',
      [req.user.id]
    )
    const cur = currentRows[0]

    // --- NEW COMMITMENT SUBMISSION (first time or after Rejection) ---
    if (initial_commitment !== undefined && initial_commitment.trim()) {
      if (cur.commitment_locked) {
        return res.status(403).json({
          message: "You've reached the maximum number of resubmissions (3). Please contact your Admin."
        })
      }
      // Only allow submission when: no commitment exists yet OR status is Rejected
      const canSubmitCommitment = !cur.initial_commitment?.trim() || cur.review_status === 'Rejected'
      if (!canSubmitCommitment) {
        return res.status(403).json({
          message: 'Commitment cannot be changed while On Review or Accepted.'
        })
      }

      await pool.query(
        `UPDATE users SET initial_commitment=?, review_status='On Review', review_reason=NULL, status=NULL, updated_at=NOW() WHERE id=?`,
        [initial_commitment.trim(), req.user.id]
      )
      await pool.query(
        `INSERT INTO progress_log (user_id, status, measurable_impact, challenges, updated_by_name, updated_by_role, commitment_text)
         VALUES (?,'ON_REVIEW','Commitment submitted for review.',NULL,?,'You',?)`,
        [req.user.id, req.user.name, initial_commitment.trim()]
      )
      return res.json({ message: 'Commitment submitted! Waiting for Admin review.' })
    }

    // --- PROGRESS UPDATE (only allowed when commitment Accepted, and no update already pending) ---
    if (cur.review_status !== 'Accepted') {
      return res.status(403).json({
        message: 'Progress updates are only allowed after your commitment is Accepted by an Admin.'
      })
    }
    if (cur.progress_status === 'On Review') {
      return res.status(403).json({
        message: 'Your last progress update is still awaiting Admin review.'
      })
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}` })
    }

    const setFields = [`progress_status = 'On Review'`, `progress_review_reason = NULL`]
    const vals = []
    if (status) { setFields.push(`status = ?`); vals.push(status) }
    if (measurable_impact !== undefined) { setFields.push(`measurable_impact = ?`); vals.push(measurable_impact) }
    setFields.push(`updated_at = NOW()`)
    vals.push(req.user.id)
    await pool.query(`UPDATE users SET ${setFields.join(', ')} WHERE id = ?`, vals)

    // Log progress update (pending Admin approval)
    await pool.query(
      `INSERT INTO progress_log
       (user_id, status, measurable_impact, challenges, updated_by_name, updated_by_role, attachment_url, commitment_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        status || cur.status,
        measurable_impact ?? null,
        challenges ?? null,
        req.user.name,
        'You',
        req.file ? `/uploads/${req.file.filename}` : null,
        cur.initial_commitment
      ]
    )
    res.json({ message: 'Progress update submitted! Waiting for Admin review.' })
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

export default router
