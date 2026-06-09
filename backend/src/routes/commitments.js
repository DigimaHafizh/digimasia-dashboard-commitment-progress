import { Router } from 'express'
import { pool } from '../db/pool.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// Public dashboard — no challenges field
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, heart_value, initial_commitment, measurable_impact, status, review_reason, is_admin
      FROM users ORDER BY name ASC
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
router.patch('/me', authMiddleware, async (req, res) => {
  const { status, challenges, measurable_impact, initial_commitment } = req.body
  try {
    const setFields = []
    const vals = []
    let idx = 1
    if (status) { setFields.push(`status = $${idx++}`); vals.push(status) }
    if (challenges !== undefined) { setFields.push(`challenges = $${idx++}`); vals.push(challenges) }
    if (measurable_impact !== undefined) { setFields.push(`measurable_impact = $${idx++}`); vals.push(measurable_impact) }
    if (initial_commitment !== undefined) { setFields.push(`initial_commitment = $${idx++}`); vals.push(initial_commitment) }
    setFields.push(`updated_at = NOW()`)
    vals.push(req.user.id)
    await pool.query(`UPDATE users SET ${setFields.join(', ')} WHERE id = $${idx}`, vals)
    // Append to progress log
    await pool.query(
      `INSERT INTO progress_log
       (user_id, status, measurable_impact, challenges, updated_by_name, updated_by_role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, status, measurable_impact ?? null, challenges ?? null, req.user.name, 'You']
    )
    res.json({ message: 'Progress updated successfully' })
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

export default router
