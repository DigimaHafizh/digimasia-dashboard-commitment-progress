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
    console.log('Columns in first row:', Object.keys(data[0]));
    console.log('Total rows:', data.length);
    console.log('First 3 rows:', data.slice(0, 3));
} catch (e) {
    console.error(e);
}
