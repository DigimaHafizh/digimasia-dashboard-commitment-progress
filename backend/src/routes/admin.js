import { Router } from 'express'
import { pool } from '../db/pool.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import * as XLSX from 'xlsx'

const router = Router()
router.use(authMiddleware, adminMiddleware)

// All commitments including private fields
router.get('/commitments', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY name ASC')
    res.json(rows)
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Admin revises a commitment
router.patch('/commitments/:id', async (req, res) => {
  const { id } = req.params
  const { initial_commitment } = req.body
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    if (!rows.length) return res.status(404).json({ message: 'User not found' })
    const old = rows[0].initial_commitment
    await pool.query('UPDATE users SET initial_commitment = $1, review_reason = NULL, updated_at = NOW() WHERE id = $2', [initial_commitment, id])
    await pool.query(
      'INSERT INTO commitment_revisions (user_id, old_commitment, new_commitment, admin_id, admin_name) VALUES ($1,$2,$3,$4,$5)',
      [id, old, initial_commitment, req.user.id, req.user.name]
    )
    res.json({ message: 'Commitment revised and audit logged' })
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Full progress history for Excel export
router.get('/progress-history', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.name, u.heart_value, u.status, pl.status as log_status,
             pl.measurable_impact, pl.created_at, pl.updated_by_name, pl.updated_by_role
      FROM progress_log pl
      JOIN users u ON u.id = pl.user_id
      ORDER BY pl.created_at DESC
    `)
    res.json(rows)
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Admin updates a user's progress
router.patch('/progress/:id', async (req, res) => {
  const { id } = req.params
  const { status, challenges, measurable_impact } = req.body
  try {
    const setFields = []
    const vals = []
    let idx = 1
    if (status) { setFields.push(`status = $${idx++}`); vals.push(status) }
    if (challenges !== undefined) { setFields.push(`challenges = $${idx++}`); vals.push(challenges) }
    if (measurable_impact !== undefined) { setFields.push(`measurable_impact = $${idx++}`); vals.push(measurable_impact) }
    setFields.push(`updated_at = NOW()`)
    vals.push(id)

    await pool.query(`UPDATE users SET ${setFields.join(', ')} WHERE id = $${idx}`, vals)
    // Append to progress log as Admin
    await pool.query(
      `INSERT INTO progress_log 
       (user_id, status, measurable_impact, challenges, updated_by_name, updated_by_role) 
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, status, measurable_impact ?? null, challenges ?? null, req.user.name, 'Admin']
    )
    res.json({ message: 'Progress overridden successfully by Admin' })
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

export default router
