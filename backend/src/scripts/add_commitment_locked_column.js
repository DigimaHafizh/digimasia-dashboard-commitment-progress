import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function run() {
    try {
        console.log('Adding commitment_locked column...')
        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS commitment_locked BOOLEAN DEFAULT FALSE
        `)
        console.log('Done.')
    } catch (e) {
        console.error('Migration error:', e)
    } finally {
        await pool.end()
    }
}
run()
