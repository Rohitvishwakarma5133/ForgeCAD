import type { } from 'next/server';
import { fallbackJobStorage } from '@/lib/fallback-job-storage';
import { mongoJobStorage as mongoStorage } from '@/lib/mongodb-job-storage';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const controller = new AbortController();
  const { signal } = controller;

  const { id } = params;
  const conversionId = id;

  const encoder = new TextEncoder();
  let interval: NodeJS.Timeout | null = null;
  let pingInterval: NodeJS.Timeout | null = null;
  let closed = false;

  async function getJobWithFallback() {
    // Try MongoDB first
    try {
      const job = await mongoStorage.getJob(conversionId);
      if (job) return { job, storageType: 'mongodb' as const };
    } catch (err) {
      // ignore, will try fallbacks
    }

    // Try file-based storage
    try {
      const { jobStorage } = await import('@/lib/job-storage');
      const fileJob = jobStorage.getJob(conversionId) as any;
      if (fileJob) return { job: fileJob, storageType: 'file' as const };
    } catch (err) {
      // ignore, will try fallback memory
    }

    // Try memory fallback
    try {
      const memJob = await fallbackJobStorage.getJob(conversionId);
      if (memJob) return { job: memJob, storageType: 'memory' as const };
    } catch (err) {
      // ignore
    }

    return { job: null as any, storageType: 'unknown' as const };
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(streamController) {
      // Helper to send SSE event
      const send = (data: any) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        streamController.enqueue(encoder.encode(payload));
      };

      // Initial event to confirm connection
      send({ event: 'connected', conversionId, timestamp: Date.now() });

      // Keep-alive pings
      pingInterval = setInterval(() => {
        if (closed) return;
        streamController.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);

      // Poll job status every second and emit deltas
      interval = setInterval(async () => {
        if (closed) return;
        try {
          const { job, storageType } = await getJobWithFallback();

          if (!job) {
            // Inform client job not found yet (could be eventual consistency)
            send({ status: 'pending', conversionId, storageType, message: 'Waiting for job to initialize' });
            return;
          }

          // Build a lean payload similar to your /api/status response
          const base = {
            conversionId,
            filename: job.filename,
            progress: job.progress,
            message: job.message,
            storageType,
            currentStage: job.globalTimer?.currentStage || 'Processing',
            fileIntake: job.fileIntake,
            progressInfo: {
              estimatedTimeRemaining: 0,
            },
          };

          if (job.status === 'processing') {
            const elapsedTime = job.globalTimer ? Math.round((Date.now() - job.globalTimer.startTime) / 1000) : 0;
            const estimatedTimeRemaining = estimateRemainingTime(job.progress || 0, elapsedTime);
            send({
              ...base,
              status: 'processing',
              processingTime: elapsedTime,
              progressInfo: {
                ...base.progressInfo,
                estimatedTimeRemaining,
              },
            });
          } else if (job.status === 'completed') {
            const processingTime = job.globalTimer ? Math.round((Date.now() - job.globalTimer.startTime) / 1000) : job.result?.processingTime || 0;
            send({
              ...base,
              status: 'completed',
              progress: 100,
              processingTime,
              result: {
                documentType: job.result?.documentType || 'Engineering Drawing',
                confidence: job.result?.confidence || 0.85,
                equipmentCount: job.result?.statistics?.equipmentCount || 0,
                instrumentCount: job.result?.statistics?.instrumentCount || 0,
                pipeCount: job.result?.statistics?.pipeCount || 0,
                downloadUrl: `/api/download/${conversionId}`,
              },
            });
            // Complete the stream
            cleanup();
            streamController.close();
            closed = true;
          } else if (job.status === 'failed') {
            send({
              ...base,
              status: 'failed',
              error: job.error || 'Unknown error',
            });
            cleanup();
            streamController.close();
            closed = true;
          }
        } catch (err: any) {
          send({ status: 'error', error: err?.message || 'Unknown error' });
        }
      }, 1000);

      // Handle client abort
      request.signal.addEventListener('abort', () => {
        cleanup();
        if (!closed) {
          closed = true;
          try { streamController.close(); } catch {}
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  const cleanup = () => {
    if (interval) clearInterval(interval);
    if (pingInterval) clearInterval(pingInterval);
  };

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
    status: 200,
  });
}

function estimateRemainingTime(currentProgress: number, elapsedTime: number): number {
  if (currentProgress <= 0 || currentProgress >= 100) return 0;
  const estimatedTotalTime = (elapsedTime / currentProgress) * 100;
  const remainingTime = estimatedTotalTime - elapsedTime;
  return Math.max(0, Math.round(remainingTime));
}
