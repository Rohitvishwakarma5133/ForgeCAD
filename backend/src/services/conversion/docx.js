import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import fs from 'fs';
import { joinGenerated } from '../../utils/fs.js';

export async function toDOCX(report) {
  const json = report.aiJson || {};
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: 'CADly Report', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: `Document ID: ${report._id}` }),
          new Paragraph({ text: `Filename: ${report.filename}` }),
          new Paragraph({ text: `AI Model: ${report.aiModel}` }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Structured Data', heading: HeadingLevel.HEADING_2 }),
          new Paragraph({
            children: [new TextRun({ text: JSON.stringify(json, null, 2) })],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const file = joinGenerated(`${report._id}.docx`);
  fs.writeFileSync(file, buffer);
  return { path: file, filename: `${report._id}.docx` };
}
