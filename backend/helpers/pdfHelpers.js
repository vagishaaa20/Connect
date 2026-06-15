import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export const extractPdfText = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (err) {
    console.error('PDF extraction error:', err.message);
    throw new Error('Failed to extract PDF text');
  }
};
