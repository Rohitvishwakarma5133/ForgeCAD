import vision from '@google-cloud/vision';

export async function ocrGoogleVision(filePath) {
  try {
    const client = new vision.ImageAnnotatorClient();
    const [result] = await client.textDetection(filePath);
    const detections = result.textAnnotations || [];
    const text = detections.length ? detections[0].description : '';
    return { engine: 'vision', text, meta: { locale: result?.fullTextAnnotation?.pages?.[0]?.property?.detectedLanguages } };
  } catch (err) {
    throw new Error(`Google Vision failed: ${err.message || err}`);
  }
}
