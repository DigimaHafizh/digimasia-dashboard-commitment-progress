import { Router } from 'express'
import { pool } from '../db/pool.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import * as XLSX from 'xlsx'

const router = Router()
router.use(authMiddleware, adminMiddleware)

// All commitments including latest history details for proof and obstacles
router.get('/commitments', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.*, 
             pl.challenges as latest_challenges,
             pl.attachment_url as latest_attachment_url
      FROM users u
      LEFT JOIN LATERAL (
        SELECT challenges, attachment_url 
        FROM progress_log 
        WHERE user_id = u.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) pl ON true
      WHERE u.is_admin = false
      ORDER BY u.is_hidden ASC, u.name ASC
    `)
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
  const { review_status, review_reason } = req.body
  try {
    const setFields = [`review_status = $1`]
    const vals = [review_status]

    if (review_status === 'Accepted' || review_status === 'Pending') {
      setFields.push(`review_reason = NULL`)
    } else if (review_status === 'Declined') {
      setFields.push(`status = 'Not Started'`) // Force restart/revise
      if (review_reason) {
        setFields.push(`review_reason = $${vals.length + 1}`)
        vals.push(review_reason)
      }
    }

    setFields.push(`updated_at = NOW()`)
    vals.push(id)

    // Explicitly using the last index of the vals array for the WHERE clause
    const idParamIndex = vals.length;
    await pool.query(`UPDATE users SET ${setFields.join(', ')} WHERE id = $${idParamIndex}`, vals)

    // Get current commitment for the log
    const { rows: uRows } = await pool.query('SELECT initial_commitment FROM users WHERE id = $1', [id])
    const currentCommitment = uRows[0]?.initial_commitment

    // Append to progress log ONLY for explicit outcomes (Accepted/Declined)
    if (review_status !== 'Pending') {
      const logStatus = review_status === 'Accepted' ? 'APPROVED' : 'DECLINED'
      const logMessage = review_status === 'Declined' ? `Review Declined: ${review_reason || 'No specific reason provided.'}` : `Review Status Updated: Approved`
      await pool.query(
        `INSERT INTO progress_log 
         (user_id, status, measurable_impact, challenges, updated_by_name, updated_by_role) 
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, logStatus, logMessage, null, req.user.name, 'Admin']
      )
    }
    res.json({ message: 'Progress overridden successfully by Admin' })
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Admin updates user metadata (is_hidden, review_reason)
router.patch('/users/:id', async (req, res) => {
  const { id } = req.params
  const { is_hidden, review_reason } = req.body
  try {
    const setFields = []
    const vals = []

    if (is_hidden !== undefined) {
      setFields.push(`is_hidden = $${vals.length + 1}`)
      vals.push(is_hidden)
    }
    if (review_reason !== undefined) {
      setFields.push(`review_reason = $${vals.length + 1}`)
      vals.push(review_reason)
    }

    if (!setFields.length) return res.status(400).json({ message: 'No fields to update' })

    setFields.push(`updated_at = NOW()`)
    vals.push(id)
    await pool.query(`UPDATE users SET ${setFields.join(', ')} WHERE id = $${vals.length}`, vals)
    res.json({ message: 'User updated' })
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

export default router
