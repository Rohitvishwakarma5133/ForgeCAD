import express from 'express';
import path from 'path';
import { Report } from '../models/Report.js';
import { convertReport } from '../services/conversion/index.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  const format = (req.query.format || 'pdf').toString();
  const doc = await Report.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  if (doc.status !== 'done') return res.status(409).json({ error: `Report status is ${doc.status}` });

  try {
    const { path: filePath, filename } = await convertReport(doc, format);
    res.download(filePath, filename);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

export default router;
