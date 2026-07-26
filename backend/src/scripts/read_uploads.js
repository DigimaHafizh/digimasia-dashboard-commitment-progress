import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const files = [
        '../../../backend/uploads/1781456246132-[Game Xtraordinary].xlsx',
        '../../../backend/uploads/1781456819877-[Game Xtraordinary].xlsx'
    ];

    for (const f of files) {
        const file = path.join(__dirname, f);
        try {
            const wb = xlsx.readFile(file);
            console.log(`Sheets in ${path.basename(f)}:`, wb.SheetNames);
            if (wb.SheetNames.length > 0) {
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = xlsx.utils.sheet_to_json(ws);
                console.log(`  First sheet has ${data.length} rows.`);
                console.log('  Sample row:', data[0]);
            }
        } catch (e) {
            console.error(e);
        }
    }
}
run();
