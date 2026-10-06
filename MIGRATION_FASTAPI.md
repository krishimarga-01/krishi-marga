# Krishi Marga: n8n → FastAPI Production Migration Guide

## 1. Overview & Architecture

Krishi Marga's AI inference and advisory backend has migrated from the legacy n8n workflow engine to an isolated, high-performance, asynchronous FastAPI backend service.

### Architecture Transition

**Before (Legacy):**
```
React Native App (Expo)
   └── HTTPS POST
         └── n8n Cloud Webhook (https://krishimarga01.app.n8n.cloud/webhook/detect-disease)
               ├── Gemini 2.0 Flash / Pro Failover
               └── Response JSON
```

**After (FastAPI Architecture):**
```
React Native App (Expo)
   └── HTTPS POST
         └── FastAPI Service (backend_fastapi/)
               ├── Pydantic & MIME Validation (<4MB/image, <12MB total)
               ├── 75 Canonical Crop & Regional South Indian Alias Normalization
               ├── 3-Tier Sequential Gemini Failover (gemini-2.5-flash -> 2.5-pro -> 2.0-flash)
               ├── CPU-Optimized Local ONNX Offline Fallback (7 regional crops)
               ├── Background Async Supabase Scan Logging (non-blocking)
               └── Standardized Envelope & NormalizedResult JSON
```

---

## 2. API Contract & Endpoints

| Endpoint | Method | Purpose | Input / Payload | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| `/health` | GET | Health & ONNX status | None | `{"status": "ok", "onnx_models_loaded": 7, ...}` |
| `/webhook/detect-disease` | POST | Crop disease diagnosis | Multipart form (`crop`, `language`, `images`, `symptoms`, `latitude`, `longitude`) | `{"success": true, "requestId": "...", "result": {...}}` |
| `/webhook/scan-pesticide` | POST | Pesticide label scan & OCR | Multipart form (`images`, `language`, `crop`) | `{"success": true, "scan_type": "pesticide", "result": {...}}` |
| `/webhook/detect-disease` (legacy) | POST | Backwards-compatible pesticide | Multipart form with `scan_type='pesticide'` | Same as `/webhook/scan-pesticide` |
| `/webhook/detect-disease` | POST | Health ping probe | JSON `{"ping": true}` | `{"status": "ok", "ping": "pong", "server": "FastAPI"}` |

---

## 3. Frontend Integration (`src/`)

The mobile application connects through `src/services/config.ts`:
- **Primary production URL configuration:** `EXPO_PUBLIC_BACKEND_URL` in `.env` or EAS Build variables.
- **Dedicated route mapping:**
  - `diagnosis` → `detect-disease`
  - `pesticide` → `scan-pesticide` (with legacy fallback to `detect-disease` fully supported)
- **Dev mode support:** `EXPO_PUBLIC_DEV_BACKEND_URL` allows `http://127.0.0.1:8000` during local emulation without crashing production release checks.

---

## 4. Production Deployment Guide

### Option A: Containerized (Docker)
```bash
# From repository root:
docker build -t krishi-marga-fastapi -f backend_fastapi/Dockerfile .
docker run -d -p 8000:8000 \
  -e GEMINI_API_KEY="your-gemini-key" \
  -e SUPABASE_URL="https://your-proj.supabase.co" \
  -e SUPABASE_KEY="your-anon-key" \
  -e CORS_ORIGINS="*" \
  krishi-marga-fastapi
```

### Option B: Direct Python / Uvicorn (VM / Cloud Run / VPS)
```bash
cd backend_fastapi
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 5. Rollback Safety Runbook

If any operational regression occurs in production, rollback can be performed in under 60 seconds without redeploying frontend binary releases:

1. **Retained Workflows:**
   - Legacy n8n workflow definitions remain intact at:
     - `active_workflow.json`
     - `n8n/krishi_marga_workflow.json`
2. **Rollback Variable:**
   - In `.env` or EAS Build environment variables, restore:
     ```
     EXPO_PUBLIC_BACKEND_URL=https://krishimarga01.app.n8n.cloud/webhook/detect-disease
     ```
3. **Pesticide Route Backward Compatibility:**
   - If rolling back, change `src/services/config.ts`:
     ```typescript
     const WEBHOOK_PATHS: Record<BackendEndpoint, string> = {
       diagnosis: 'detect-disease',
       pesticide: 'detect-disease',
     };
     ```
4. Verify the legacy webhook returns HTTP 200 via `POST https://krishimarga01.app.n8n.cloud/webhook/detect-disease`.
