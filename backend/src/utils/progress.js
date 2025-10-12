const channels = new Map(); // jobId -> Set(res)

export function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  };
}

export function subscribe(jobId, res) {
  if (!channels.has(jobId)) channels.set(jobId, new Set());
  channels.get(jobId).add(res);
}

export function unsubscribe(jobId, res) {
  const set = channels.get(jobId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) channels.delete(jobId);
}

export function publish(jobId, event, data = {}) {
  const set = channels.get(jobId);
  if (!set) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) res.write(payload);
}

export function close(jobId) {
  const set = channels.get(jobId);
  if (!set) return;
  for (const res of set) res.end();
  channels.delete(jobId);
}
