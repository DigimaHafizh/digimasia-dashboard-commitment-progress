import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log("Starting DB reset migration...");

        // 1. Clear all active fields in the users table
        console.log("Clearing all active user commitment fields (initial_commitment, status, review_status, review_reason, measurable_impact, challenges)...");
        const { rowCount } = await pool.query(
            `UPDATE users 
             SET initial_commitment = NULL, 
                 status = NULL, 
                 review_status = NULL, 
                 review_reason = NULL,
                 measurable_impact = NULL,
                 challenges = NULL
             WHERE is_admin = false`
        );
        console.log(`Successfully cleared ${rowCount} user profiles.`);

        // 2. Truncate progress_log to clean all old history
        console.log("Truncating progress_log table...");
        await pool.query("TRUNCATE TABLE progress_log RESTART IDENTITY CASCADE");
        console.log("Successfully truncated progress_log history.");

        console.log("DB Reset Migration complete!");
    } catch (e) {
        console.error("Migration error:", e);
    } finally {
        await pool.end();
    }
}
run();
