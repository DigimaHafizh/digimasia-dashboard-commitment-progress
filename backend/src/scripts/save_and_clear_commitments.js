import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log("Starting save and clear migration...");
        // 1. Get all non-admin users with active commitments
        const { rows: users } = await pool.query(
            "SELECT id, name, initial_commitment, status, review_status, review_reason FROM users WHERE is_admin = false AND initial_commitment IS NOT NULL"
        );
        console.log(`Found ${users.length} users with active commitments.`);

        for (const user of users) {
            console.log(`Processing user: ${user.name}`);
            // Check if this commitment is already logged in progress_log
            const { rows: logs } = await pool.query(
                "SELECT id FROM progress_log WHERE user_id = $1 AND commitment_text = $2",
                [user.id, user.initial_commitment]
            );

            if (logs.length === 0) {
                console.log(`  Writing commitment to progress_log for ${user.name}...`);
                const logStatus = user.review_status === 'Accepted' ? 'APPROVED' : user.review_status === 'Rejected' ? 'REJECTED' : 'ON_REVIEW';
                const logMessage = user.review_status === 'Rejected' && user.review_reason
                    ? `Commitment Rejected: ${user.review_reason}`
                    : user.review_status === 'Accepted'
                        ? 'Commitment Accepted'
                        : 'Commitment submitted for review';

                await pool.query(
                    `INSERT INTO progress_log 
                     (user_id, status, measurable_impact, challenges, updated_by_name, updated_by_role, commitment_text) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [user.id, logStatus, logMessage, null, 'System Migration', 'System', user.initial_commitment]
                );
            } else {
                console.log(`  Commitment log already exists for ${user.name}.`);
            }
        }

        // 2. Clear all active user commitments and set to NULL
        console.log("Clearing active commitments from user profiles...");
        const { rowCount } = await pool.query(
            `UPDATE users 
             SET initial_commitment = NULL, 
                 status = NULL, 
                 review_status = NULL, 
                 review_reason = NULL 
             WHERE is_admin = false`
        );
        console.log(`Successfully cleared ${rowCount} user profile commitments.`);
        console.log("Migration complete!");
    } catch (e) {
        console.error("Migration error:", e);
    } finally {
        await pool.end();
    }
}
run();
