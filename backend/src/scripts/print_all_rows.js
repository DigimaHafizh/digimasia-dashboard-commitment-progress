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
    const rows = data.filter(r => r['Employee Name'] === 'Agunahwan Absin' || r['Employee Name'] === 'Agung Trisno Atmojo');
    console.log('Rows:', JSON.stringify(rows, null, 2));
} catch (e) {
    console.error(e);
}
