export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';
export const BACKEND_API_KEY = process.env.NEXT_PUBLIC_BACKEND_API_KEY || '';

export async function uploadFileToBackend(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BACKEND_URL}/upload`, {
    method: 'POST',
    headers: BACKEND_API_KEY ? { 'x-api-key': BACKEND_API_KEY } : undefined,
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json(); // { id, jobId }
}

export function openSSE(jobId: string) {
  const url = new URL(`${BACKEND_URL}/jobs/${jobId}/stream`);
  // API key via query param for EventSource
  if (BACKEND_API_KEY) url.searchParams.set('api_key', BACKEND_API_KEY);
  return new EventSource(url.toString());
}

export async function fetchReport(id: string) {
  const res = await fetch(`${BACKEND_URL}/report/${id}`, {
    headers: BACKEND_API_KEY ? { 'x-api-key': BACKEND_API_KEY } : undefined,
  });
  if (!res.ok) throw new Error(`Report fetch failed: ${res.status}`);
  return res.json();
}

export async function downloadReport(id: string, format: string) {
  const url = new URL(`${BACKEND_URL}/download/${id}`);
  url.searchParams.set('format', format.toLowerCase());
  const headers: Record<string, string> = {};
  if (BACKEND_API_KEY) headers['x-api-key'] = BACKEND_API_KEY;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res;
}
