import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceRoot = path.resolve(__dirname, '../../../');
const evidenceDir = path.join(workspaceRoot, 'Uploaded_Evidence');
const uploadsDir = path.resolve(__dirname, '../uploads');

// Create uploads directory if not exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

try {
    const files = fs.readdirSync(evidenceDir);
    console.log(`Found ${files.length} files in Uploaded_Evidence.`);
    let count = 0;

    for (const file of files) {
        // Match the pattern: [No] - [Employee Name] - [Original Filename]
        // Example: "1 - Agunahwan Absin - 1781662821072-Digima.png"
        const parts = file.split(' - ');
        if (parts.length >= 3) {
            const originalFilename = parts.slice(2).join(' - '); // in case filename contains ' - '
            const srcPath = path.join(evidenceDir, file);
            const destPath = path.join(uploadsDir, originalFilename);

            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Copied: "${file}" ➔ "${originalFilename}"`);
            count++;
        }
    }
    console.log(`Successfully restored ${count} evidence files to backend/uploads.`);
} catch (e) {
    console.error('Error during evidence restoration:', e);
}
