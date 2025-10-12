import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { handleUpload } from '../controllers/uploadController.js';

const router = express.Router();

const uploadDir = path.resolve(process.cwd(), 'backend', process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${ts}_${safe}`);
  },
});

const upload = multer({ storage });

router.post('/', upload.single('file'), handleUpload);

export default router;
