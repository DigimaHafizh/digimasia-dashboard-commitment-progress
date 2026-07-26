import XLSX from 'xlsx';
import { pool } from '../db/pool.js';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper function to download file over HTTPS
function downloadFile(url, destPath) {
    return new Promise((resolve) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => resolve(true));
                });
            } else {
                file.close(() => {
                    fs.unlink(destPath, () => resolve(false));
                });
            }
        }).on('error', () => {
            fs.unlink(destPath, () => resolve(false));
            resolve(false);
        });
    });
}

async function exportCommitments() {
    const client = await pool.connect();
    try {
        console.log('⏳ Fetching commitment data...');

        // Fetch users and join with the latest progress log
        const query = `
      SELECT u.id, u.name, u.pin, u.is_admin, u.heart_value, u.review_reason, 
             u.initial_commitment, u.status, u.review_status, u.is_hidden, u.created_at,
             pl.challenges as latest_challenges,
             pl.attachment_url as latest_attachment_url
      FROM users u
      LEFT JOIN LATERAL (
        SELECT challenges, attachment_url 
        FROM progress_log 
        WHERE user_id = u.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) pl ON true
      WHERE u.is_admin = FALSE 
      ORDER BY u.is_hidden ASC, u.name ASC
    `;

        const res = await client.query(query);
        console.log(`📊 Retrieved ${res.rows.length} employee records.`);

        // Setup folder paths
        const workspaceRoot = path.resolve(__dirname, '../../../');
        const uploadsDir = path.resolve(__dirname, '../uploads');
        const evidenceDir = path.join(workspaceRoot, 'Uploaded_Evidence');

        // Create Uploaded_Evidence folder if not exists
        if (!fs.existsSync(evidenceDir)) {
            fs.mkdirSync(evidenceDir, { recursive: true });
            console.log('📁 Created Uploaded_Evidence folder at root.');
        }

        const formattedData = [];
        const linkMapping = [];

        for (let i = 0; i < res.rows.length; i++) {
            const row = res.rows[i];
            const no = i + 1;
            let onlineUrl = null;
            let localRelativePath = null;

            // Clean check for evidence file
            if (row.latest_attachment_url && row.latest_attachment_url.startsWith('/uploads/')) {
                const rawFilename = row.latest_attachment_url.replace(/^\/uploads\//, '');
                const filename = decodeURIComponent(rawFilename);
                const sourceFilePath = path.join(uploadsDir, filename);

                // Target filename structure: [No] - [Employee Name] - [Filename]
                const cleanName = (row.name || 'Unknown').replace(/[\\/:*?"<>|]/g, '');
                const destFilename = `${no} - ${cleanName} - ${filename}`;
                const destFilePath = path.join(evidenceDir, destFilename);

                onlineUrl = `https://backend-production-5f2fc.up.railway.app/api/uploads/${rawFilename}`;
                localRelativePath = `.\\Uploaded_Evidence\\${destFilename}`;

                // Try local copy first, fallback to remote download
                if (fs.existsSync(sourceFilePath)) {
                    fs.copyFileSync(sourceFilePath, destFilePath);
                    console.log(`   📂 Copied from local uploads: ${destFilename}`);
                } else {
                    console.log(`   🌐 Downloading from production host: ${filename}...`);
                    const success = await downloadFile(onlineUrl, destFilePath);
                    if (success) {
                        console.log(`      ✅ Downloaded successfully: ${destFilename}`);
                    } else {
                        console.log(`      ❌ Download failed for online URL: ${onlineUrl}`);
                        localRelativePath = null; // Reset local link since file couldn't be obtained
                    }
                }
            }

            formattedData.push({
                'No': no,
                'Employee Name': row.name || '-',
                'PIN Access': row.pin || '-',
                'Heart Value': row.heart_value || '-',
                'Commitment Statement': row.initial_commitment || 'No commitment entered yet.',
                'Progress Status': row.status || 'Not Started',
                'Review Status': row.review_status || 'Pending',
                'Warning Status': row.review_reason || '-',
                'Latest Challenges': row.latest_challenges || '-',
                'Online Evidence Link': onlineUrl ? 'View File (Web)' : '-',
                'Local Evidence Link': localRelativePath ? 'View File (Local)' : '-',
                'Visibility Status': row.is_hidden ? 'Hidden' : 'Visible',
                'Created At': row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '-'
            });

            linkMapping.push({ onlineUrl, localRelativePath });
        }

        // Create a new workbook and custom worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(formattedData);

        // Apply hyperlink properties to J (Online Link) and K (Local Link) columns
        for (let i = 0; i < linkMapping.length; i++) {
            const rowNum = i + 2;
            const mapping = linkMapping[i];

            if (mapping.onlineUrl) {
                ws[`J${rowNum}`] = {
                    t: 's',
                    v: 'View File (Web)',
                    l: { Target: mapping.onlineUrl, Tooltip: 'Click to open evidence on server' }
                };
            }

            if (mapping.localRelativePath) {
                ws[`K${rowNum}`] = {
                    t: 's',
                    v: 'View File (Local)',
                    l: { Target: mapping.localRelativePath, Tooltip: 'Click to open local file' }
                };
            }
        }

        // Apply column widths to make it neat and readable
        const cols = [
            { wch: 5 },   // No
            { wch: 25 },  // Employee Name
            { wch: 12 },  // PIN Access
            { wch: 20 },  // Heart Value
            { wch: 60 },  // Commitment Statement
            { wch: 18 },  // Progress Status
            { wch: 15 },  // Review Status
            { wch: 18 },  // Warning Status
            { wch: 40 },  // Latest Challenges
            { wch: 22 },  // Online Evidence Link
            { wch: 22 },  // Local Evidence Link
            { wch: 18 },  // Visibility Status
            { wch: 22 }   // Created At
        ];
        ws['!cols'] = cols;

        // Append worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Commitments');

        // Define output path (Project root directory)
        const outputPath = path.resolve(workspaceRoot, 'Commitment_Report_2026.xlsx');

        XLSX.writeFile(wb, outputPath);
        console.log(`\n✅ Excel export successful! File saved to:`);
        console.log(`📍 ${outputPath}`);
    } catch (error) {
        console.error('❌ Export failed:', error);
    } finally {
        client.release();
        process.exit(0);
    }
}

exportCommitments();
