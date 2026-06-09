import xlsx from 'xlsx';
const wb = xlsx.readFile('./frontend/src/asset/Data_PIN_Karyawan_Digimasia_v2.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws);
console.log('=== ALL PINS ===');
data.forEach(row => {
    const name = row['Nama Karyawan']?.toString().trim();
    const pin = row['PIN Access']?.toString().trim();
    if (name) console.log(`${name.padEnd(40)} PIN: ${pin}`);
});
