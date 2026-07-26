import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function run() {
    try {
        const { rowCount } = await pool.query(`UPDATE users SET is_hidden = false WHERE is_hidden = true`)
        console.log(`Unhid ${rowCount} users.`)
    } catch (e) {
        console.error('Error:', e)
    } finally {
        await pool.end()
    }
}
run()
