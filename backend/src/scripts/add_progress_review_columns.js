import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function run() {
    try {
        console.log('Adding progress_status / progress_review_reason columns...')
        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS progress_status VARCHAR(20),
            ADD COLUMN IF NOT EXISTS progress_review_reason TEXT
        `)
        console.log('Done.')
    } catch (e) {
        console.error('Migration error:', e)
    } finally {
        await pool.end()
    }
}
run()
