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
             u.challenges as latest_challenges,
             CASE WHEN u.initial_commitment IS NOT NULL THEN pl.attachment_url ELSE NULL END as latest_attachment_url
      FROM users u
      LEFT JOIN LATERAL (
        SELECT attachment_url
        FROM progress_log
        WHERE user_id = u.id AND attachment_url IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      ) pl ON true
      WHERE u.is_admin = false
      ORDER BY u.is_hidden ASC, u.name ASC
    `)
    res.json(rows)
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Admin updates visibility only (is_hidden) — v2.1: no more direct commitment editing
router.patch('/commitments/:id', async (req, res) => {
  const { id } = req.params
  const { is_hidden } = req.body
  try {
    if (is_hidden === undefined) return res.status(400).json({ message: 'is_hidden is required' })
    await pool.query(`UPDATE users SET is_hidden = $1, updated_at = NOW() WHERE id = $2`, [is_hidden, id])
    res.json({ message: 'Visibility updated' })
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Full progress history for Excel export (includes hidden users; excludes admin accounts)
router.get('/progress-history', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.name, u.heart_value, pl.status as log_status, pl.commitment_text,
             pl.measurable_impact, pl.challenges, pl.attachment_url,
             pl.created_at, pl.updated_by_name, pl.updated_by_role
      FROM progress_log pl
      JOIN users u ON u.id = pl.user_id
      WHERE u.is_admin = false
      ORDER BY u.name ASC, pl.created_at ASC
    `)
    res.json(rows)
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Get a specific user's commitment history for admin comparison
router.get('/commitments/:id/history', async (req, res) => {
  const { id } = req.params
  try {
    const { rows } = await pool.query(`
      SELECT id, status, commitment_text, measurable_impact, challenges, attachment_url, created_at, updated_by_name, updated_by_role
      FROM progress_log
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [id])
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Admin Approve / Decline a commitment review (v2.1)
// review_status: 'Accepted' | 'Rejected' | 'On Review' (reset)
// review_reason: mandatory free-text comment when declining
router.patch('/progress/:id', async (req, res) => {
  const { id } = req.params
  const { review_status, review_reason } = req.body

  // Decline requires a comment
  if (review_status === 'Rejected' && !review_reason?.trim()) {
    return res.status(400).json({ message: 'Review comment is required when declining.' })
  }

  try {
    const { rows: uRows } = await pool.query('SELECT initial_commitment FROM users WHERE id = $1', [id])
    const currentCommitment = uRows[0]?.initial_commitment

    const setFields = [`review_status = $1`]
    const vals = [review_status]

    if (review_status === 'Accepted') {
      // Clear review comment on approve; keep commitment locked
      setFields.push(`review_reason = NULL`)
    } else if (review_status === 'Rejected') {
      // Store admin comment so user can see it in their form
      setFields.push(`review_reason = $${vals.length + 1}`)
      vals.push(review_reason.trim())
      // Clear commitment and progress status in active table
      setFields.push(`initial_commitment = NULL`)
      setFields.push(`status = NULL`)
    } else if (review_status === 'On Review') {
      // Reset: clear previous admin comment
      setFields.push(`review_reason = NULL`)
    }

    setFields.push(`updated_at = NOW()`)
    vals.push(id)
    const idParamIndex = vals.length
    await pool.query(`UPDATE users SET ${setFields.join(', ')} WHERE id = $${idParamIndex}`, vals)

    // Append to progress log for audit trail
    const logStatus = review_status === 'Accepted' ? 'APPROVED' : review_status === 'Rejected' ? 'REJECTED' : 'ON_REVIEW'
    const logMessage = review_status === 'Rejected'
      ? `Commitment Declined: ${review_reason.trim()}`
      : review_status === 'Accepted'
        ? 'Commitment Approved by Admin'
        : 'Commitment reset to On Review'

    await pool.query(
      `INSERT INTO progress_log
       (user_id, status, measurable_impact, challenges, updated_by_name, updated_by_role, commitment_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, logStatus, logMessage, null, req.user.name, 'Admin', currentCommitment || '-']
    )

    res.json({ message: 'Review updated successfully' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Admin Approve / Decline a PROGRESS UPDATE review (separate gate from commitment review)
// progress_status: 'Accepted' (clears to null — nothing pending) | 'Rejected' | 'On Review' (reset)
// review_reason: mandatory free-text comment when declining
router.patch('/progress-update/:id', async (req, res) => {
  const { id } = req.params
  const { progress_status, review_reason } = req.body

  if (progress_status === 'Rejected' && !review_reason?.trim()) {
    return res.status(400).json({ message: 'Review comment is required when declining.' })
  }

  try {
    const { rows: uRows } = await pool.query('SELECT initial_commitment, status, measurable_impact FROM users WHERE id = $1', [id])
    const cur = uRows[0]

    const setFields = []
    const vals = []

    if (progress_status === 'Accepted') {
      // Confirm the already-written status/measurable_impact/challenges as official
      setFields.push(`progress_status = NULL`, `progress_review_reason = NULL`)
    } else if (progress_status === 'Rejected') {
      // Clear the proposed progress values; user must redo the update
      setFields.push(`progress_status = 'Rejected'`)
      setFields.push(`progress_review_reason = $${vals.length + 1}`)
      vals.push(review_reason.trim())
      setFields.push(`status = NULL`, `measurable_impact = NULL`, `challenges = NULL`)
    } else if (progress_status === 'On Review') {
      setFields.push(`progress_status = 'On Review'`, `progress_review_reason = NULL`)
    }

    setFields.push(`updated_at = NOW()`)
    vals.push(id)
    const idParamIndex = vals.length
    await pool.query(`UPDATE users SET ${setFields.join(', ')} WHERE id = $${idParamIndex}`, vals)

    const logStatus = progress_status === 'Accepted' ? 'PROGRESS_APPROVED' : progress_status === 'Rejected' ? 'PROGRESS_REJECTED' : 'ON_REVIEW'
    const logMessage = progress_status === 'Rejected'
      ? `Progress Update Declined: ${review_reason.trim()}`
      : progress_status === 'Accepted'
        ? `Progress Update Approved by Admin (${cur.status || 'update'})`
        : 'Progress update reset to On Review'

    await pool.query(
      `INSERT INTO progress_log
       (user_id, status, measurable_impact, challenges, updated_by_name, updated_by_role, commitment_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, logStatus, logMessage, null, req.user.name, 'Admin', cur.initial_commitment || '-']
    )

    res.json({ message: 'Progress review updated successfully' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
})

// Admin updates user visibility only
router.patch('/users/:id', async (req, res) => {
  const { id } = req.params
  const { is_hidden } = req.body
  try {
    if (is_hidden === undefined) return res.status(400).json({ message: 'No fields to update' })
    await pool.query(`UPDATE users SET is_hidden = $1, updated_at = NOW() WHERE id = $2`, [is_hidden, id])
    res.json({ message: 'User updated' })
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Admin adds a new user (employee)
router.post('/users', async (req, res) => {
  const { name, pin, heart_value } = req.body
  try {
    if (!name?.trim() || !pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ message: 'Name and a 4-digit PIN are required.' })
    }
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE pin = $1', [pin])
    if (existing.length) return res.status(409).json({ message: 'That PIN is already in use.' })

    const { rows } = await pool.query(
      `INSERT INTO users (name, pin, heart_value, is_admin, is_hidden) VALUES ($1, $2, $3, false, false) RETURNING id`,
      [name.trim(), pin, heart_value || null]
    )
    res.status(201).json({ message: 'User added successfully', id: rows[0].id })
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

// Admin deletes a user (cascades to their progress_log entries)
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params
  try {
    const { rows } = await pool.query('SELECT is_admin FROM users WHERE id = $1', [id])
    if (!rows.length) return res.status(404).json({ message: 'User not found' })
    if (rows[0].is_admin) return res.status(403).json({ message: 'Cannot delete an Admin account.' })

    await pool.query('DELETE FROM users WHERE id = $1', [id])
    res.json({ message: 'User deleted successfully' })
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }) }
})

export default router
