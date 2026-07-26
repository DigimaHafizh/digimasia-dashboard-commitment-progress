import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, '../../../Commitment_Report_2026.xlsx');
try {
    const wb = xlsx.readFile(file);
    console.log('Sheets in Commitment_Report_2026.xlsx:', wb.SheetNames);
    if (wb.SheetNames.length > 0) {
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(ws);
        console.log(`First sheet has ${data.length} rows.`);
        console.log('Sample row:', data[0]);
    }
} catch (e) {
    console.error(e);
}
