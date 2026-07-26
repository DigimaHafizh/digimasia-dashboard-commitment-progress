import pg from 'pg';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const excelPath = path.join(__dirname, '../../../Commitment_Report_2026.xlsx');
const evidenceDir = path.join(__dirname, '../../../Uploaded_Evidence');

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

function parseDateString(str) {
    if (!str || str === '-') return new Date();
    // Parse "14/6/2026, 18.47.51"
    const match = str.match(/(\d+)\/(\d+)\/(\d+),\s*(\d+)\.(\d+)\.(\d+)/);
    if (match) {
        const [_, d, m, y, h, min, s] = match;
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min), parseInt(s));
    }
    return new Date(str);
}

async function restore() {
    const client = await pool.connect();
    try {
        console.log('🔄 Loading Commitment_Report_2026.xlsx...');
        const wb = xlsx.readFile(excelPath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(ws);
        console.log(`Loaded ${data.length} rows from Excel.`);

        console.log('📁 Scanning Uploaded_Evidence folder...');
        const evidenceFiles = fs.existsSync(evidenceDir) ? fs.readdirSync(evidenceDir) : [];
        console.log(`Found ${evidenceFiles.length} files in Uploaded_Evidence.`);

        console.log('🧹 Truncating progress_log to rewrite clean history...');
        await client.query('TRUNCATE TABLE progress_log RESTART IDENTITY CASCADE');

        let logsCreated = 0;

        for (const row of data) {
            const name = row['Employee Name']?.toString().trim();
            const commitment = row['Commitment Statement']?.toString().trim();
            const progressStatus = row['Progress Status']?.toString().trim();
            const reviewStatus = row['Review Status']?.toString().trim();
            const warningStatus = row['Warning Status']?.toString().trim();
            const latestChallenges = row['Latest Challenges']?.toString().trim();
            const createdAtStr = row['Created At']?.toString().trim();
            const no = row['No'];

            if (!name || !commitment || commitment === 'No commitment entered yet.') {
                continue;
            }

            // Find user in database
            const userRes = await client.query('SELECT id, name FROM users WHERE LOWER(name) = LOWER($1)', [name]);
            if (userRes.rows.length === 0) {
                console.log(`⚠️ User not found in database: "${name}"`);
                continue;
            }
            const user = userRes.rows[0];

            // Resolve evidence attachment
            let attachmentUrl = null;
            const prefix = `${no} - ${name} - `;
            const matchedFile = evidenceFiles.find(f => f.toLowerCase().startsWith(prefix.toLowerCase()));
            if (matchedFile) {
                const parts = matchedFile.split(' - ');
                if (parts.length >= 3) {
                    const originalFilename = parts.slice(2).join(' - ');
                    attachmentUrl = `/uploads/${originalFilename}`;
                }
            }

            const baseDate = parseDateString(createdAtStr);
            const submissionDate = new Date(baseDate.getTime() - 15 * 60 * 1000); // 15 mins before
            const approvalDate = new Date(baseDate.getTime() - 10 * 60 * 1000); // 10 mins before

            // 1. Insert Submission Log (Employee submitted the commitment)
            await client.query(
                `INSERT INTO progress_log 
                 (user_id, status, commitment_text, measurable_impact, challenges, updated_by_name, updated_by_role, created_at)
                 VALUES ($1, 'SUBMITTED', $2, NULL, NULL, $3, 'Employee', $4)`,
                [user.id, commitment, user.name, submissionDate]
            );
            logsCreated++;

            // 2. Insert Admin Approval Log
            await client.query(
                `INSERT INTO progress_log 
                 (user_id, status, commitment_text, measurable_impact, challenges, updated_by_name, updated_by_role, created_at)
                 VALUES ($1, 'APPROVED', $2, 'Commitment Accepted by Admin', NULL, 'Admin', 'Admin', $3)`,
                [user.id, commitment, approvalDate]
            );
            logsCreated++;

            // 3. Insert Progress Update Log (only if In Progress or Achieved)
            if (progressStatus === 'In Progress') {
                const challengesText = (latestChallenges && latestChallenges !== '-') ? latestChallenges : null;
                await client.query(
                    `INSERT INTO progress_log 
                     (user_id, status, commitment_text, measurable_impact, challenges, attachment_url, updated_by_name, updated_by_role, created_at)
                     VALUES ($1, 'IN_PROGRESS', $2, NULL, $3, $4, $5, 'Employee', $6)`,
                    [user.id, commitment, challengesText, attachmentUrl, user.name, baseDate]
                );
                logsCreated++;
            } else if (progressStatus === 'Achieved') {
                const challengesText = (latestChallenges && latestChallenges !== '-') ? latestChallenges : null;
                await client.query(
                    `INSERT INTO progress_log 
                     (user_id, status, commitment_text, measurable_impact, challenges, attachment_url, updated_by_name, updated_by_role, created_at)
                     VALUES ($1, 'ACHIEVED', $2, 'Komitmen telah tercapai.', $3, $4, $5, 'Employee', $6)`,
                    [user.id, commitment, challengesText, attachmentUrl, user.name, baseDate]
                );
                logsCreated++;
            }
            // 'Not Started' → skip (no progress log entry needed)

            console.log(`✅ Restored history for: "${user.name}" (Status: ${progressStatus})`);
        }

        console.log(`\n🎉 Restoration completed successfully! Created ${logsCreated} progress log entries.`);
    } catch (e) {
        console.error('❌ Failed to restore database history:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

restore();
