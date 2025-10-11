# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project commands
- Install dependencies
```bash path=null start=null
npm install
```
- Start local dev server (Next.js)
```bash path=null start=null
npm run dev
```
- Build production bundle
```bash path=null start=null
npm run build
```
- Start production server locally
```bash path=null start=null
npm run start
```
- Lint the codebase (ESLint via Next)
```bash path=null start=null
npm run lint
```
- Health check (local)
```bash path=null start=null
npm run health
# responds from http://localhost:3000/api/health
```
- Deploy (requires Vercel CLI login)
```bash path=null start=null
npm run deploy:preview   # deploy to preview
npm run deploy:vercel    # deploy to production
```

Environment
- Required to enable Mongo-backed job storage and health checks:
  - MONGODB_URI
- Common variables used by features/auth (from README):
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
  - Optional: OPENAI_API_KEY (OCR/AI analysis)

Architecture overview
- Framework/runtime
  - Next.js App Router app/ with React 19; optimized for serverless deployment (Vercel). See next.config.js for serverless-friendly config (standalone output, module fallbacks for fs/path/crypto on client, sharp/canvas aliases, security headers, redirects).
- UI surfaces
  - Marketing/entry pages under app/(e.g., /features, /pricing, /about, /converter).
  - Auth-aware dashboard under app/dashboard with nested pages (upload, history, projects).
  - Component library in components/ui plus feature components in components/demo, components/home, components/layout, components/dashboard.
- API surface (App Router routes under app/api)
  - POST /api/upload: accepts multipart form-data with a CAD file, creates a processing job, persists via Mongo or in-memory fallback, kicks off background analysis.
  - GET /api/status/[id]: polls current job by conversionId from storage with detailed progress stages and timing metadata.
  - GET /api/download/[id]: returns generated outputs in multiple formats (dwg, dxf, pdf, csv, xlsx, json) based on completed analysis.
  - GET /api/health and GET /api/health/mongodb: basic health and Mongo-specific diagnostics (liveness of DB and job-storage service).
  - /api/sessions: Clerk-backed auth probe (GET), non-creating POST stub.

Data/processing flow
- Job storage abstraction
  - Primary: lib/mongodb-job-storage.ts persists ProcessingJob via Mongoose model lib/models/ProcessingJob.ts (schema + indexes, JSON serialization helpers).
  - Fallback: lib/fallback-job-storage.ts in-memory Map to avoid hard failures if Mongo is unavailable.
  - Legacy/utility: lib/job-storage.ts file-based JSON store (not on the hot path of current routes).
- Ingestion and analysis pipeline
  - Upload route saves file to uploads/ (repo-level dir, gitignored) and seeds an initial job with status/progress + fileIntake/globalTimer metadata.
  - OCR/AI analysis: lib/ocr-ai-analysis.ts orchestrates
    - OCR: tesseract.js
    - Optional AI structuring: OpenAI SDK (OPENAI_API_KEY) to extract equipment/instrumentation/piping/text/dimensions and statistics into a unified AIAnalysisResult.
    - CAD parsing: lib/cad-parser.ts integrates dxf-parser and lib/dwg-parser.ts (tries system tools like dwg2dxf/libredwg if available, with intelligent fallbacks) to augment geometry/metadata.
    - Results are written back to job storage and temporary artifacts cleaned up.
  - Types/shape of results are centralized in lib/cad-analysis.ts (CADAnalysisResult), consumed by generators and API responses.
- Output generation
  - DXF/DWG: /api/download constructs DXF entities from analysis results and offers DWG-compatible content as raw bytes.
  - PDF: lib/pdf-report-generator.ts builds a multi-section report via pdf-lib using CADAnalysisResult.
  - CSV/Excel: CSV assembled in-route; XLSX via exceljs.

Operational notes
- Without MONGODB_URI, Mongo-backed routes like /api/health/mongodb will fail to initialize; upload/status/download gracefully fall back to in-memory storage where coded, but persistence is not guaranteed across server restarts.
- Application data directories (gitignored): uploads/, job-storage/, analysis-results/.
- ESLint config: eslint.config.mjs extends next/core-web-vitals and next/typescript, with TypeScript-focused rules set to warn. Use npm run lint.

Testing
- No test runner or test scripts are defined in package.json. There is currently no configured way to “run a single test.”
