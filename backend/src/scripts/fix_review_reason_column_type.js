import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function run() {
    try {
        console.log('Widening users.review_reason from VARCHAR(20) to TEXT...')
        await pool.query(`ALTER TABLE users ALTER COLUMN review_reason TYPE TEXT`)
        console.log('Also widening progress_status/status just in case (short enum values only, safe no-op if already fine)...')
        await pool.query(`ALTER TABLE users ALTER COLUMN progress_review_reason TYPE TEXT`)
        console.log('Done.')
    } catch (e) {
        console.error('Migration error:', e)
    } finally {
        await pool.end()
    }
}
run()
