# DocuVerve Intelligence

**Enterprise-grade document utility platform** — 25 PDF tools, in-memory backend, React frontend with WASM privacy mode.

---

## Project Structure

```
docuverve/
├── package.json          ← Workspace root (npm workspaces)
├── server/               ← Node.js Express API (port 5000)
│   ├── index.js
│   ├── middleware/       ← cors, errorHandler, multer (memoryStorage)
│   ├── routes/           ← 5 route groups (organize, optimize, convert, security, intel)
│   └── controllers/      ← 24 processing controllers
└── client/               ← React 18 + Vite + Tailwind (port 5173)
    └── src/
        ├── constants/tools.js     ← 25 tool definitions
        ├── hooks/                 ← useFileQueue, useWasm
        ├── lib/                   ← api.js, wasmProcessors.js
        ├── components/            ← layout, ui, workspace, dashboard
        └── pages/                 ← Dashboard, Workspace
```

---

## Quick Start

> **Requirement:** Node.js 18+ must be installed. Download from https://nodejs.org

### 1. Install all dependencies
```bash
cd "d:\PDF EDITER WEBSITE\docuverve"
npm install
```

### 2. Start development servers (both simultaneously)
```bash
npm run dev
```

This starts:
- **API Server** → http://localhost:5000
- **React App** → http://localhost:5173

### 3. Or start individually
```bash
# Backend only
npm run dev:server

# Frontend only
npm run dev:client
```

---

## API Reference

Base URL: `http://localhost:5000/api/v1/pdf`

| Category | Endpoints |
|---|---|
| **Organize** | `/organize/merge` `/organize/split` `/organize/remove-pages` `/organize/extract-pages` `/organize/reorder` |
| **Optimize** | `/optimize/compress` `/optimize/repair` |
| **Convert** | `/convert/image-to-pdf` `/convert/html-to-pdf` `/convert/pdf-to-word` `/convert/pdf-to-excel` `/convert/pdf-to-jpg` `/convert/pdf-to-pdfa` |
| **Security** | `/security/protect` `/security/unlock` `/security/watermark` `/security/compare` `/security/sign` `/security/auto-redact` |
| **Intel** | `/intel/summarize` `/intel/translate` `/intel/forms-detector` |

### Health check
```
GET http://localhost:5000/health
```

### Example: Merge PDFs
```bash
curl -X POST http://localhost:5000/api/v1/pdf/organize/merge \
  -F "files=@doc1.pdf" \
  -F "files=@doc2.pdf" \
  --output merged.pdf
```

### Example: Compress with size stats
```bash
curl -X POST http://localhost:5000/api/v1/pdf/optimize/compress \
  -F "file=@large.pdf" \
  -F "tier=high" \
  -D - --output compressed.pdf
# Check headers: X-Original-Size, X-Compressed-Size, X-Savings-Percent
```

### Example: Auto-redact PII
```bash
curl -X POST http://localhost:5000/api/v1/pdf/security/auto-redact \
  -F "file=@document.pdf" \
  -F 'patterns=["Aadhaar","PAN","Email","Phone_IN"]' \
  --output redacted.pdf
```

### Example: PDF → Excel with OCR
```bash
curl -X POST "http://localhost:5000/api/v1/pdf/convert/pdf-to-excel?ocr=true" \
  -F "file=@scanned.pdf" \
  --output data.xlsx
```

---

## Frontend Features

- **Dashboard** — Searchable 25-tool grid with category tabs (All / Organize / Optimize / Convert / Security / Intel)
- **Workspace** — Universal tool page with:
  - Multi-file drag-and-drop zone
  - Sortable file queue with name / size / page count metadata
  - Dynamic config panel (sliders, toggles, multicheck, selects per tool)
  - WASM privacy toggle for eligible tools (merge, split, watermark, remove-pages)
  - Result panel with download, compression stats, and JSON analysis display

---

## WASM Privacy Mode

For tools marked `wasmEligible: true`, toggle the **WASM: Off → On** button in the workspace header. Processing runs entirely in the browser via `pdf-lib` — **files never leave your device**.

Eligible tools: Merge PDF, Split PDF, Remove Pages, Watermark PDF.

---

## Notes on Conversion Stubs

`/convert/word-to-pdf` and `/convert/excel-to-pdf` return HTTP 501 — these require a LibreOffice sidecar binary not available in a pure Node.js environment. All other 22+ routes are fully operational.
