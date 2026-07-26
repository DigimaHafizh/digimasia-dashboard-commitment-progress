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
    const rows = data.filter(r => r['Progress Status'] === 'Achieved');
    console.log('Achieved rows count:', rows.length);
    console.log('Achieved rows:', JSON.stringify(rows.slice(0, 5), null, 2));
} catch (e) {
    console.error(e);
}
