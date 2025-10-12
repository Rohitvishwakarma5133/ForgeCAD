export function requireApiKey(req, res, next) {
  const configured = process.env.BACKEND_API_KEY || '';
  if (!configured) return res.status(500).json({ error: 'Server API key not configured' });

  // Accept via header or query param (SSE EventSource cannot set headers)
  const fromHeader = req.get('x-api-key') || req.get('X-API-Key');
  const fromQuery = req.query.api_key;
  const provided = (fromHeader || fromQuery || '').toString();

  if (provided && provided === configured) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}
