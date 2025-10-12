export function buildPrompt(ocrChunks, context = {}) {
  const combined = ocrChunks.map(c => `# Engine: ${c.engine}\n${(c.text||'').trim()}`).join('\n\n');
  const system = `You are CADly's analysis engine. Read OCR output from multiple engines (Vision, Tesseract, TrOCR, Mathpix, possibly symbols) and produce a single structured JSON object.\n\nRequirements:\n- Return ONLY valid JSON. No markdown.\n- Include sections: document_type, title, parties, dates, totals, items (array), handwriting_notes, math_expressions, raw_excerpt.\n- Fill missing fields as null if unknown.\n- Preserve numbers as numbers when possible.`;
  const user = `Filename: ${context.filename || 'unknown'}\n\nOCR INPUT:\n${combined}\n\nProduce the JSON now.`;
  return { system, user };
}
