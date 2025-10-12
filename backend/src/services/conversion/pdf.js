import fs from 'fs';
import PDFDocument from 'pdfkit';
import { joinGenerated } from '../../utils/fs.js';

export async function toPDF(report) {
  const file = joinGenerated(`${report._id}.pdf`);
  await new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(file);
    doc.pipe(stream);

    doc.fontSize(18).text('CADly Report', { underline: true });
    doc.moveDown();

    const json = report.aiJson || {};
    doc.fontSize(12).text(`Document ID: ${report._id}`);
    doc.text(`Filename: ${report.filename}`);
    doc.text(`AI Model: ${report.aiModel}`);
    doc.moveDown();

    doc.fontSize(14).text('Structured Data');
    doc.moveDown(0.5);
    doc.fontSize(10).text(JSON.stringify(json, null, 2));

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
  return { path: file, filename: `${report._id}.pdf` };
}
