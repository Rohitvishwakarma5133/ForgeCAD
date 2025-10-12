import express from 'express';
import { Report } from '../models/Report.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  const doc = await Report.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

export default router;
