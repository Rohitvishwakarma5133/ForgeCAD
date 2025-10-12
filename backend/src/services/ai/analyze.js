import { analyzeWithOpenAI } from './openai.js';
import { analyzeWithClaude } from './claude.js';

export async function analyzeWithAI(ocrChunks, context = {}) {
  try {
    return await analyzeWithOpenAI(ocrChunks, context);
  } catch (err) {
    console.warn('[ai] OpenAI failed, falling back to Claude:', err?.message || err);
    return await analyzeWithClaude(ocrChunks, context);
  }
}
