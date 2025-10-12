# CADly Monorepo Structure and Environment Variables

This repository is split into two projects:

- frontend/ — Next.js app (user interface)
- backend/ — Express service (OCR, AI, MongoDB, downloads, SSE)

Both apps run independently and communicate over HTTP.

Frontend
- Path: frontend/
- Start: npm run dev (default Next.js scripts)
- Env file: frontend/.env.local
- Notable variables used:
  - NEXT_PUBLIC_APP_URL: http://localhost:3000 (or your deployed URL)
  - OPENAI_API_KEY: OpenAI key (used if frontend calls OpenAI directly)
  - OPENAI_MODEL, OPENAI_MAX_TOKENS, OPENAI_TEMPERATURE: optional model config
  - CLAUDE_API_KEY, CLAUDE_MODEL, CLAUDE_MAX_TOKENS: optional Claude config
  - GOOGLE_AI_PROJECT_NAME / NUMBER, GOOGLE_AI_API_KEY: if used
  - GOOGLE_VISION_API_KEY: if frontend needs to call Vision proxy
  - MONGODB_URI: only if frontend serverless routes directly connect to DB
  - Any app-specific variables you maintain (Forge, JWT secrets, etc.)

Backend
- Path: backend/
- Start: npm run dev (http://localhost:5050 by default)
- Env file: backend/.env
- Required variables:
  - PORT: 5050
  - FRONTEND_ORIGIN: http://localhost:3000 (CORS)
  - MONGODB_URI: MongoDB connection string
  - OPENAI_API_KEY: primary AI for analysis
  - OPENAI_MODEL: gpt-4o or equivalent
  - ANTHROPIC_API_KEY: Claude fallback
  - CLAUDE_MODEL: claude-3-5-sonnet-20241022
  - GOOGLE_APPLICATION_CREDENTIALS: absolute path to GCP service account JSON (for Vision client)
  - HUGGINGFACE_API_KEY: for TrOCR (handwriting)
  - MATHPIX_APP_ID / MATHPIX_APP_KEY: for Mathpix
  - UPLOAD_DIR, TEMP_DIR, PY_OPENCV, PYTHON_PATH: processing options

Data Flow Summary
1) Frontend sends POST /upload to backend with a file.
2) Backend preprocesses image, runs OCR engines, aggregates results with AI (OpenAI → fallback Claude), stores structured JSON in MongoDB.
3) Frontend subscribes to GET /jobs/:jobId/stream for real-time progress.
4) Frontend fetches JSON via GET /report/:id.
5) Frontend requests downloads via GET /download/:id?format=pdf|docx|csv.

Variable Mapping (from frontend/.env.local to backend/.env)
- OPENAI_KEY → backend OPENAI_API_KEY
- CLAUDE_KEY → backend ANTHROPIC_API_KEY
- HUGGINGFACE_API_KEY (or CADly_HWR_Token) → backend HUGGINGFACE_API_KEY
- GOOGLE_APPLICATION_CREDENTIALS:
  - Frontend may keep an API key value if needed for client-side/proxy usage.
  - Backend MUST be a file path to the GCP service account JSON. Example:
    C:\Users\Rohit Kumar\Desktop\cadly\backend\gcp-service-account.json
- FRONTEND_ORIGIN in backend/.env must match the actual frontend URL.

Notes
- Never commit secrets. Keep *.env* files out of version control.
- If you change your frontend port/host, update FRONTEND_ORIGIN in backend/.env.
- On Windows, escape backslashes in paths.
