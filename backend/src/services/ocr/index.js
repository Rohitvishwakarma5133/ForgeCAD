import { preprocessImage } from './preprocess.js';
import { ocrGoogleVision } from './googleVision.js';
import { ocrTesseract } from './tesseract.js';
import { ocrTrOCR } from './trocr.js';
import { ocrMathpix } from './mathpix.js';

export async function runAllOCR(filePath) {
  const pre = await preprocessImage(filePath);
  const tasks = [];

  // Engines
  tasks.push(safe('vision', () => ocrGoogleVision(filePath)));
  tasks.push(safe('tesseract', () => ocrTesseract(pre)));
  if (process.env.HUGGINGFACE_API_KEY) tasks.push(safe('trocr', () => ocrTrOCR(pre)));
  if (process.env.MATHPIX_APP_ID && process.env.MATHPIX_APP_KEY) tasks.push(safe('mathpix', () => ocrMathpix(filePath)));

  const settled = await Promise.allSettled(tasks.map((t) => t()));
  const out = [];
  for (const s of settled) {
    if (s.status === 'fulfilled' && s.value?.text) out.push(s.value);
  }
  return out;
}

function safe(name, fn) {
  return async () => {
    try { return await fn(); } catch (err) { return { engine: name, text: '', meta: { error: String(err?.message || err) } }; }
  };
}
