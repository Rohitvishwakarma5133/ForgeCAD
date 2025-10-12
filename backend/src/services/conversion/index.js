import { toPDF } from './pdf.js';
import { toDOCX } from './docx.js';
import { toCSV } from './csv.js';

export async function convertReport(report, format = 'pdf') {
  switch ((format || '').toLowerCase()) {
    case 'pdf':
      return await toPDF(report);
    case 'docx':
      return await toDOCX(report);
    case 'csv':
      return await toCSV(report);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
