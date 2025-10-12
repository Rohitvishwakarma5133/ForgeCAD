import fs from 'fs';
import path from 'path';

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
  return p;
}

export function joinGenerated(...parts) {
  const p = path.resolve(process.cwd(), 'backend', 'generated', ...parts);
  ensureDir(path.dirname(p));
  return p;
}

export function safeUnlink(p) {
  try { fs.unlinkSync(p); } catch (_) {}
}
