import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import xlsx from 'xlsx';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const employees = [
    { name: 'Daniel V. Lie', heart_value: 'Global Chief Executive' },
    { name: 'Karib Chiang', heart_value: 'Technology & Operation' },
    { name: 'Dyah Prajnaparamita', heart_value: 'Technology & Operation' },
    { name: 'Vania Sari Muchardie', heart_value: 'Organization Support' },
    { name: 'Honey Fatricya', heart_value: 'Organization Support' },
    { name: 'Stefany Arlianty', heart_value: 'Content Design' },
    { name: 'Alfridho Yuliananda', heart_value: 'Content Design' },
    { name: 'Inayatul Noor Amaliah', heart_value: 'Content Design' },
    { name: 'Frista Diah Ramadhani', heart_value: 'Content Design' },
    { name: 'Amelia Nur Azizah', heart_value: 'Content Design' },
    { name: 'Nabila Paradays', heart_value: 'Content Design' },
    { name: 'Ratna Indah Screenaningrum', heart_value: 'Content Design' },
    { name: 'Agung Trisno Atmojo', heart_value: 'Content Design' },
    { name: 'Fredy Wijaya', heart_value: 'Content Design' },
    { name: 'Asep Badrudin', heart_value: 'Content Design' },
    { name: 'Stepanus', heart_value: 'Interaction Design' },
    { name: 'Andre Alfadjrid', heart_value: 'Content Design' },
    { name: 'Hari Mujana', heart_value: 'Content Design' },
    { name: 'Heri Irwanto', heart_value: 'Interaction Design' },
    { name: 'Tedy Iman Priyo Lestanto', heart_value: 'Interaction Design' },
    { name: 'Yusuf Faisal Agus Saputro', heart_value: 'Software Engineering & QA' },
    { name: 'Agunahwan Absin', heart_value: 'Software Engineering & QA' },
    { name: 'Muhammad Reza', heart_value: 'Software Engineering & QA' },
    { name: 'Christover Ramanda Moa', heart_value: 'Software Engineering & QA' },
    { name: 'Muhammad Rizky Husain', heart_value: 'Software Engineering & QA' },
    { name: 'Wahyu Candra Indhiarta', heart_value: 'Software Engineering & QA' },
    { name: 'Candra Prasetyo', heart_value: 'Software Engineering & QA' },
    { name: 'Muhammad Hafizh Abdillah', heart_value: 'Software Engineering & QA' },
    { name: 'Fahmi Fikri Kurniawan', heart_value: 'Customer Support' },
    { name: 'Putra Indra Tri Cahya', heart_value: 'Customer Support' },
    { name: 'Cherly Diansacharina Tri W.', heart_value: 'Customer Support' },
    { name: 'Resfi Anggraeni', heart_value: 'General Affairs' },
    { name: 'Mediani Prima Ismary', heart_value: 'General Affairs' },
    { name: 'Hanafiah Yunan Putri', heart_value: 'Content Design' },
    { name: 'Mayang Gita', heart_value: 'Sales' },
    { name: 'Danny Zainaldi', heart_value: 'Project Management' }
];

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Starting seed...');

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // Read Excel File
        const excelPath = path.join(__dirname, '../../../frontend/src/asset/Commitment_Progress_Report.xlsx');
        const wb = xlsx.readFile(excelPath);
        const ws = wb.Sheets['KOMITMEN 2026'] || wb.Sheets[wb.SheetNames[0]];
        const sheetData = xlsx.utils.sheet_to_json(ws);

        // Map name to commitment (Assuming column headers "Employee Name" and "Commitment", adjust to match actual headers if different)
        // From inspection, row 1 is likely header. But let's check exact headers mapping dynamically.
        // Or we can just search by values. Let's try matching strings.
        const commitmentsMap = new Map();
        for (const row of sheetData) {
            const nameCol = Object.keys(row).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('nama'));
            const commCol = Object.keys(row).find(k => k.toLowerCase().includes('commitment') || k.toLowerCase().includes('komitmen'));
            const noteCol = Object.keys(row).find(k => k.toLowerCase().includes('catatan') || k.toLowerCase().includes('note'));

            if (nameCol) {
                const name = row[nameCol]?.toString().trim();
                let comm = row[commCol]?.toString().trim();
                let note = noteCol ? row[noteCol]?.toString().trim() : null;

                if (comm === '???') comm = null;

                let reviewReason = null;
                if (!comm) {
                    reviewReason = 'NEW_USER';
                } else if (note) {
                    if (note.toLowerCase().includes('tidak terukur')) reviewReason = 'NOT_MEASURABLE';
                    if (note.toLowerCase().includes('terlalu optimis')) reviewReason = 'TOO_OPTIMISTIC';
                }

                const matchedEmp = employees.find(e => e.name.toLowerCase() === name?.toLowerCase() || name?.toLowerCase().includes(e.name.toLowerCase()));
                if (matchedEmp) {
                    commitmentsMap.set(matchedEmp.name, { comm, reviewReason });
                }
            }
        }

        // Read PIN Excel File
        const pinExcelPath = path.join(__dirname, '../../../frontend/src/asset/Data_PIN_Karyawan_Digimasia_v2.xlsx');
        const pinWb = xlsx.readFile(pinExcelPath);
        const pinWs = pinWb.Sheets[pinWb.SheetNames[0]];
        const pinData = xlsx.utils.sheet_to_json(pinWs);
        const pinsMap = new Map();
        for (const row of pinData) {
            const name = row['Nama Karyawan']?.toString().trim();
            const pinValue = row['PIN Access']?.toString().trim();
            if (name && pinValue) {
                pinsMap.set(name.toLowerCase(), pinValue);
            }
        }

        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8').replace(/^\uFEFF/, '');

        console.log('Dropping existing tables to refresh schema...');
        await client.query('DROP TABLE IF EXISTS progress_log CASCADE; DROP TABLE IF EXISTS commitment_revisions CASCADE; DROP TABLE IF EXISTS users CASCADE;');

        console.log('Running schema.sql to ensure tables exist...');
        await client.query(schemaSql);

        for (const emp of employees) {
            const entry = commitmentsMap.get(emp.name) || { comm: null, reviewReason: 'NEW_USER' };
            let { comm, reviewReason } = entry;

            if (!comm) comm = null;
            if (!reviewReason && !comm) reviewReason = 'NEW_USER';

            // Get PIN from map or fallback to a default if missing
            const pin = pinsMap.get(emp.name.toLowerCase()) || '9999';

            await client.query(
                `INSERT INTO users (name, heart_value, pin, status, initial_commitment, review_reason)
                 VALUES ($1, $2, $3, 'Not Started', $4, $5)`,
                [emp.name, emp.heart_value || 'Customer Support', pin, comm, reviewReason]
            );
        }

        // Add admin (using the ADMIN_PIN from .env or default 0000)
        const adminPin = process.env.ADMIN_PIN || '0000';
        await client.query(
            `INSERT INTO users (name, heart_value, pin, is_admin, status)
             VALUES ($1, $2, $3, true, 'Not Started')`,
            ['Admin', 'System Administration', adminPin]
        );

        console.log(`Seeded ${employees.length} employees + 1 Admin.`);
    } catch (err) {
        console.error('Error seeding:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
