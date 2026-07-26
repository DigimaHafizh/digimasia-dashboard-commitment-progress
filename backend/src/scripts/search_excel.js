import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, '../../../Commitment_Report_2026.xlsx');

try {
    const wb = xlsx.readFile(file);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws);
    const matched = data.find(r => JSON.stringify(r).includes('Untuk task2 baru') || JSON.stringify(r).includes('lebih rapih'));
    console.log('Search matches:', matched);
} catch (e) {
    console.error(e);
}
