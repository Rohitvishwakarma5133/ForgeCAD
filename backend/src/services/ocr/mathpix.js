import fs from 'fs';
import path from 'path';
import axios from 'axios';

export async function ocrMathpix(filePath) {
  const appId = process.env.MATHPIX_APP_ID;
  const appKey = process.env.MATHPIX_APP_KEY;
  if (!appId || !appKey) throw new Error('Mathpix credentials not set');
  const img = fs.readFileSync(filePath).toString('base64');

  const payload = {
    src: `data:image/${path.extname(filePath).slice(1) || 'png'};base64,${img}`,
    formats: ["text", "data"],
    data_options: { include_asciimath: true, include_latex: true }
  };

  const { data } = await axios.post('https://api.mathpix.com/v3/text', payload, {
    headers: {
      'Content-Type': 'application/json',
      'app_id': appId,
      'app_key': appKey,
    },
    timeout: 60000,
    validateStatus: () => true,
  });

  if (data?.error) throw new Error(`Mathpix error: ${data.error}`);
  const text = data?.text || '';
  return { engine: 'mathpix', text, meta: { data } };
}
