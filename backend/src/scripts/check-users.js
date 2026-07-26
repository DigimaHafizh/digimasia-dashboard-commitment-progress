import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function run() {
    try {
        const { rows } = await pool.query('SELECT id, name, status, review_status, initial_commitment FROM users WHERE is_admin = false')
        console.log('--- Current User Data ---')
        console.table(rows)
    } catch (e) {
        console.error(e)
    } finally {
        await pool.end()
    }
}
run()
