import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pinExcelPath = path.join(__dirname, '../../..', 'frontend/src/asset/Data_PIN_Karyawan_Digimasia_v2.xlsx');
const wb = xlsx.readFile(pinExcelPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws);

console.log('Name,PIN');
data.forEach(row => {
    const name = row['Nama Karyawan']?.toString().trim();
    const pin = row['PIN Access']?.toString().trim();
    if (name) console.log(`${name},${pin}`);
});
