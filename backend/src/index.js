import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import path from 'path'
import authRoutes from './routes/auth.js'
import commitmentRoutes from './routes/commitments.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000

// Required for Railway load balancer (proxy) so express-rate-limit works
app.set('trust proxy', 1)

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'https://digimasia-dashboard-commitment-prog.vercel.app',
    'https://digimasia-dashboard-commitment-progress.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('ngrok-free')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}))
app.use(express.json())
// Serve uploads using absolute path so it works regardless of CWD
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')))

// Removed rate limit for login to avoid blocking office IPs during events

app.use('/api/auth', authRoutes)
app.use('/api/commitments', commitmentRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }))

// Catches multer upload errors (file too large / wrong type) and any other route error
app.use((err, req, res, next) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' })
    }
    if (err) {
        console.error(err)
        return res.status(400).json({ message: err.message || 'Upload failed.' })
    }
    next()
})

app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`))
