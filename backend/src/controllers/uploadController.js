import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Report } from '../models/Report.js';
import { publish } from '../utils/progress.js';
import { runAllOCR } from '../services/ocr/index.js';
import { analyzeWithAI } from '../services/ai/analyze.js';

export async function handleUpload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded. Use field "file".' });

  const jobId = uuidv4();
  const filename = req.file.filename;
  const filePath = req.file.path;

  const doc = await Report.create({ jobId, filename, status: 'processing', ocr: [] });

  res.status(202).json({ id: doc._id.toString(), jobId });

  // Process asynchronously
  processFile(jobId, doc._id.toString(), filePath, filename).catch((err) => {
    console.error('[pipeline] fatal', err);
  });
}

async function processFile(jobId, reportId, filePath, filename) {
  try {
    publish(jobId, 'status', { stage: 'preprocess', message: 'Preprocessing image' });

    publish(jobId, 'status', { stage: 'ocr', message: 'Running OCR engines' });
    const ocrChunks = await runAllOCR(filePath);
    publish(jobId, 'progress', { stage: 'ocr', engines: ocrChunks.map((c) => c.engine) });

    publish(jobId, 'status', { stage: 'ai', message: 'Structuring with AI' });
    const { model, json } = await analyzeWithAI(ocrChunks, { filename });

    await Report.findByIdAndUpdate(reportId, {
      $set: { status: 'done', ocr: ocrChunks, aiModel: model, aiJson: json },
    });

    publish(jobId, 'complete', { reportId });
  } catch (err) {
    await Report.findByIdAndUpdate(reportId, { $set: { status: 'error', error: String(err?.message || err) } });
    publish(jobId, 'error', { message: String(err?.message || err) });
  } finally {
    // Optionally clean uploaded file
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
}
