import fs from 'fs';

export function ensureEnv() {
  const required = ['MONGODB_URI'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.warn(`[env] Missing required env vars: ${missing.join(', ')}`);
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!fs.existsSync(p)) {
      console.warn(`[env] GOOGLE_APPLICATION_CREDENTIALS file not found: ${p}`);
    }
  }

  process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
  process.env.TEMP_DIR = process.env.TEMP_DIR || 'temp';
  process.env.PYTHON_PATH = process.env.PYTHON_PATH || 'python';
}
