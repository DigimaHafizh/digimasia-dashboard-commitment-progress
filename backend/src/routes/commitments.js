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

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
})
const upload = multer({ storage })

const router = Router()

// Public dashboard — no challenges field, no admin accounts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, heart_value, initial_commitment, measurable_impact, status, review_reason, review_status
      FROM users
      WHERE is_admin = false AND (is_hidden = false OR is_hidden IS NULL)
      ORDER BY name ASC
    `)
    res.json(rows)
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})


// Get my own commitment (with challenges)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id])
    const user = rows[0]
    // Fetch latest admin revision banner
    const rev = await pool.query(`
      SELECT admin_name, revised_at FROM commitment_revisions
      WHERE user_id = $1 ORDER BY revised_at DESC LIMIT 1
    `, [req.user.id])
    user.admin_revision_banner = rev.rows[0] ?? null
    res.json(user)
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Get my history
router.get('/me/history', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM progress_log WHERE user_id = $1 ORDER BY created_at DESC
    `, [req.user.id])
    res.json(rows)
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Update my progress
router.patch('/me', authMiddleware, upload.single('attachment'), async (req, res) => {
  const { status, challenges, measurable_impact, initial_commitment } = req.body
  try {
    const { rows: currentRows } = await pool.query('SELECT status, initial_commitment FROM users WHERE id = $1', [req.user.id])
    const cur = currentRows[0]
    const targetStatus = status
    const targetCommitment = initial_commitment || cur.initial_commitment

    const setFields = []
    const vals = []
    let idx = 1
    if (status) { setFields.push(`status = $${idx++}`); vals.push(status) }
    if (measurable_impact !== undefined) { setFields.push(`measurable_impact = $${idx++}`); vals.push(measurable_impact) }
    if (initial_commitment !== undefined) { setFields.push(`initial_commitment = $${idx++}`); vals.push(initial_commitment) }
    setFields.push(`updated_at = NOW()`)
    vals.push(req.user.id)
    await pool.query(`UPDATE users SET ${setFields.join(', ')} WHERE id = $${idx}`, vals)
    // Append to progress log
    await pool.query(
      `INSERT INTO progress_log
       (user_id, status, measurable_impact, challenges, updated_by_name, updated_by_role, attachment_url, commitment_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [req.user.id, targetStatus || cur.status, measurable_impact ?? null, challenges ?? null, req.user.name, 'You', req.file ? `/uploads/${req.file.filename}` : null, targetCommitment]
    )
    res.json({ message: 'Progress updated successfully' })
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

export default router
