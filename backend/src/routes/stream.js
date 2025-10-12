import { sseHeaders, subscribe, unsubscribe } from '../utils/progress.js';

export function initStream(req, res) {
  const jobId = req.params.id;
  res.writeHead(200, sseHeaders());
  res.write(`event: open\ndata: {"ok":true}\n\n`);
  subscribe(jobId, res);
  req.on('close', () => unsubscribe(jobId, res));
}
