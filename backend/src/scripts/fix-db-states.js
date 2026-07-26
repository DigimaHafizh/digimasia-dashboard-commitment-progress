import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function run() {
    try {
        console.log('Running database cleanup for v2.1 status requirements...')

        // 1. Reset progress status to NULL for any user who is On Review, Rejected, or Pending
        const res1 = await pool.query(`
      UPDATE users 
      SET status = NULL 
      WHERE review_status IS DISTINCT FROM 'Accepted'
    `)
        console.log(`Updated progress status to NULL for ${res1.rowCount} users awaiting review/not accepted yet.`)

        // 2. Remove legacy "Not Started" status and set to NULL (will render as Accepted starting state)
        const res2 = await pool.query(`
      UPDATE users 
      SET status = NULL 
      WHERE status = 'Not Started'
    `)
        console.log(`Cleared legacy "Not Started" status for ${res2.rowCount} users.`)

        console.log('Database cleanup completed successfully! ✅')
    } catch (e) {
        console.error('Failed to cleanup database status fields:', e)
    } finally {
        await pool.end()
    }
}
run()
