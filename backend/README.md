# CADly Backend (Express + OCR + AI)

This is the backend for CADly, a document scanning and processing platform. It handles uploads, runs OCR (Google Vision, Tesseract, TrOCR, Mathpix), aggregates results via AI (OpenAI with Claude fallback), stores structured JSON in MongoDB, and supports downloading as PDF/DOCX/CSV. Real-time progress is delivered via Server-Sent Events (SSE).

## Quick start

1) Copy environment file

```
cp backend/.env.example backend/.env
```

2) Install dependencies (run inside backend)

```
cd backend
npm install
```

3) Run locally

```
npm run dev
```

Server listens on http://localhost:5050 by default.

## API

- POST /upload — multipart/form-data with field `file`
- GET /report/:id — returns JSON report from MongoDB
- GET /download/:id?format=pdf|docx|csv — converts and downloads
- GET /jobs/:id/stream — SSE stream with progress updates

## Environment

See `.env.example` for required variables: MongoDB URI, OpenAI, Anthropic, Mathpix, Hugging Face, and Google Vision credentials path.

## Notes on OCR backends
- Google Vision: requires a GCP service account JSON; set `GOOGLE_APPLICATION_CREDENTIALS`.
- Tesseract.js: runs locally via WASM; slower but free.
- TrOCR: calls Hugging Face Inference API.
- Mathpix: requires APP_ID and APP_KEY.
- Preprocessing: uses `sharp` by default; optional Python OpenCV script (enable with `PY_OPENCV=true`).

## Deployment
- Container/VM (Railway, Render, Fly.io): recommended for long-running SSE and binary deps.
- Vercel: supported with caveats; use Node.js runtime and avoid heavy native modules. Consider running this backend separately and calling it from your Next.js app.
