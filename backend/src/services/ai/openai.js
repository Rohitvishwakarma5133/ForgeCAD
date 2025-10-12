import OpenAI from 'openai';
import { buildPrompt } from './prompt.js';

export async function analyzeWithOpenAI(ocrChunks, context = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  const client = new OpenAI({ apiKey });
  const { system, user } = buildPrompt(ocrChunks, context);

  const resp = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' }
  });

  const content = resp.choices?.[0]?.message?.content || '{}';
  const json = JSON.parse(content);
  return { model: resp.model || 'openai', json };
}
