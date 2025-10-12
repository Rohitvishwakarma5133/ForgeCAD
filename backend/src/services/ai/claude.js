import axios from 'axios';
import { buildPrompt } from './prompt.js';

export async function analyzeWithClaude(ocrChunks, context = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  const { system, user } = buildPrompt(ocrChunks, context);

  const model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20240620';
  const { data } = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model,
      system,
      max_tokens: 2000,
      temperature: 0.2,
      messages: [{ role: 'user', content: user }],
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 60000,
      validateStatus: () => true,
    }
  );

  if (data?.error) throw new Error(`Claude error: ${data.error?.message || data.error}`);
  const text = data?.content?.[0]?.text || '{}';
  const json = JSON.parse(text);
  return { model, json };
}
