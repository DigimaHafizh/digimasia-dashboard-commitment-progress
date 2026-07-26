import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, '../../seed-data/Commitment_Progress_Report.xlsx');

try {
    const wb = xlsx.readFile(file);
    console.log('Sheets in Commitment_Progress_Report.xlsx:', wb.SheetNames);
    wb.SheetNames.forEach(name => {
        const ws = wb.Sheets[name];
        const data = xlsx.utils.sheet_to_json(ws);
        console.log(`Sheet "${name}" has ${data.length} rows.`);
        if (data.length > 0) {
            console.log(`  Columns:`, Object.keys(data[0]));
        }
    });
} catch (e) {
    console.error(e);
}
