import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import commitmentRoutes from './routes/commitments.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'https://digimasia-dashboard-commitment-prog.vercel.app',
    'https://digimasia-dashboard-commitment-progress.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}))
app.use(express.json())

// Rate-limit login endpoint
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many login attempts. Please wait.' }))

app.use('/api/auth', authRoutes)
app.use('/api/commitments', commitmentRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }))

app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`))
