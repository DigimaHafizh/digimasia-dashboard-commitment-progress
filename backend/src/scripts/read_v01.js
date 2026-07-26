import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, '../../uploads/1781456246132-[Game Xtraordinary].xlsx');

try {
    const wb = xlsx.readFile(file);
    const ws = wb.Sheets['v0.1'];
    const data = xlsx.utils.sheet_to_json(ws);
    console.log('v0.1 rows count:', data.length);
    if (data.length > 0) {
        console.log('v0.1 columns:', Object.keys(data[0]));
        console.log('v0.1 sample row:', data[0]);
    }
} catch (e) {
    console.error(e);
}
