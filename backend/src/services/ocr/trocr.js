import fs from 'fs';
import axios from 'axios';

export async function ocrTrOCR(filePath) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not set');
  const url = 'https://api-inference.huggingface.co/models/microsoft/trocr-base-handwritten';
  const bytes = fs.readFileSync(filePath);
  const { data } = await axios.post(url, bytes, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/octet-stream',
    },
    timeout: 120000,
    validateStatus: () => true,
  });
  if (Array.isArray(data) && data[0]?.generated_text) {
    return { engine: 'trocr', text: data[0].generated_text, meta: {} };
  }
  if (typeof data === 'object' && data?.error) {
    throw new Error(`TrOCR error: ${data.error}`);
  }
  return { engine: 'trocr', text: String(data || ''), meta: {} };
}
