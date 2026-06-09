import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db/pool.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { pin } = req.body
  if (!pin || pin.length !== 4) return res.status(400).json({ message: 'PIN must be 4 digits.' })
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE pin = $1', [pin])
    if (!rows.length) return res.status(401).json({ message: 'Invalid PIN. Please try again.' })
    const user = rows[0]
    const token = jwt.sign({ id: user.id, name: user.name, is_admin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '8h' })
    res.json({ token, id: user.id, name: user.name, is_admin: user.is_admin })
  } catch (e) {
    console.error(e); res.status(500).json({ message: 'Server error' })
  }
})

export default router
