import Tesseract from 'tesseract.js';

export async function ocrTesseract(filePath) {
  const { data } = await Tesseract.recognize(filePath, 'eng', {
    logger: () => {},
  });
  return { engine: 'tesseract', text: data.text || '', meta: { confidence: data.confidence } };
}
