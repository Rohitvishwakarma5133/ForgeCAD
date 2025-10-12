import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureEnv } from './config/env.js';
import { connectMongo } from './config/mongo.js';
import uploadRouter from './routes/upload.js';
import reportRouter from './routes/report.js';
import downloadRouter from './routes/download.js';
import { initStream } from './routes/stream.js';
import { requireApiKey } from './middleware/apiKey.js';

dotenv.config();
ensureEnv();
await connectMongo();

const app = express();
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Static delivery of generated files (optional)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/static', express.static(path.join(__dirname, '..', 'generated')));

// Routes (protect with API key)
app.get('/jobs/:id/stream', requireApiKey, initStream);
app.use('/upload', requireApiKey, uploadRouter);
app.use('/report', requireApiKey, reportRouter);
app.use('/download', requireApiKey, downloadRouter);

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`CADly backend listening on http://localhost:${PORT}`);
});
