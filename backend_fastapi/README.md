# Krishi Marga — Parallel FastAPI Backend

High-performance, async FastAPI backend built to run side-by-side with the existing n8n workflow for Krishi Marga (SIH Agriculture AI).

---

## Architecture Overview

```
                      ┌── React Native Mobile App
                      │   (Currently pointing to n8n webhook)
                      │
                      ▼
               Original n8n Backend
               (Port: active / remote)
               [UNTOUCHED]
                      │
                      ├── Gemini 3-Tier Model Failover
                      └── Direct Webhook Response


                      ┌── Future Migration / Parallel Testing
                      │
                      ▼
               FastAPI Backend (Port: 8000)
                      │
                      ├── Validation Service (75 Crops, 1-10 Images, MIME, Size)
                      ├── Gemini Vision Service (3-tier failover matching n8n)
                      ├── ONNX Runtime Inference (Offline CPU fallback for 7+ crops)
                      ├── Pesticide Label OCR & Understanding Service
                      └── Supabase Service (Cloud image storage & audit logging)
```

---

## Key Features & n8n Parity

| Feature | n8n Workflow Node | FastAPI Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Disease Webhook** | `1. Webhook (Farmer API)` | `POST /webhook/detect-disease` & `POST /detect-disease` | ✅ Complete Parity |
| **Pesticide Webhook** | `1P. Webhook (Pesticide Label API)` | `POST /webhook/scan-pesticide` & `POST /scan-pesticide` | ✅ Complete Parity |
| **Validation** | `2. Validate Input & Crop` | `app/services/validation_service.py` & `crop_catalog.py` | ✅ Exact 75 crops & aliases |
| **Correlation ID** | Node 2 (`KRISHI-YYYYMMDD-XXXX`) | `generate_request_id("KRISHI")` | ✅ Identical Format |
| **Gemini Model 1** | `4A. Model 1 (gemini-3.5-flash-lite)` | `app/services/gemini_service.py` (15s timeout) | ✅ Complete Parity |
| **Gemini Model 2** | `4B. Model 2 (gemini-3.6-flash)` | `app/services/gemini_service.py` (15s timeout) | ✅ Complete Parity |
| **Gemini Model 3** | `4C. Model 3 (gemini-3.1-pro-preview)` | `app/services/gemini_service.py` (12s timeout) | ✅ Complete Parity |
| **Offline Inference**| Client-side only in React Native | `app/services/onnx_service.py` (Server-side edge fallback) | ✅ 7 crops supported |
| **Pesticide Scan** | Nodes `1P - 7P` | `app/services/pesticide_service.py` | ✅ Complete Parity |
| **Supabase Cloud** | Not in n8n (AsyncStorage in app) | `app/services/supabase_service.py` | ✅ Non-blocking storage & logs |
| **Error Envelopes** | Nodes `Error Response`, `Controlled Error` | Compatible JSON responses with HTTP 400/200 codes | ✅ Complete Parity |

---

## Directory Structure

```
backend_fastapi/
├── app/
│   ├── main.py                     # FastAPI app entrypoint, CORS, router mounting
│   ├── api/
│   │   └── routes/
│   │       ├── health.py           # Health check and model readiness
│   │       ├── disease.py          # /webhook/detect-disease
│   │       └── pesticide.py        # /webhook/scan-pesticide
│   ├── core/
│   │   └── config.py               # Pydantic BaseSettings environment config
│   ├── schemas/
│   │   ├── common.py               # ErrorResponse, LocationContext
│   │   ├── diagnosis.py            # DiagnosisResponse & Details
│   │   └── pesticide.py            # PesticideResponse & Details
│   └── services/
│       ├── crop_catalog.py         # 75 crops & alias matching
│       ├── validation_service.py   # MIME, size, image count, crop validation
│       ├── gemini_service.py       # 3-tier sequential model failover
│       ├── onnx_service.py         # ONNX Runtime letterboxing & inference
│       ├── pesticide_service.py    # Pesticide label reading & prompt logic
│       └── supabase_service.py     # Cloud image storage & scan logging
├── tests/
│   ├── test_api.py                 # E2E route testing with TestClient
│   ├── test_onnx.py                # ONNX model inference tests
│   └── test_validation.py          # Validation & catalog tests
├── .env.example                    # Environment variable documentation
├── requirements.txt                # Python dependencies
└── README.md                       # Documentation
```

---

## Setup & Running

### 1. Activate Virtual Environment

```bash
# Windows PowerShell
.\backend_fastapi\.venv\Scripts\Activate.ps1
```

### 2. Configure Environment

Copy `.env.example` to `.env` inside `backend_fastapi/`:

```bash
cp backend_fastapi/.env.example backend_fastapi/.env
```

Configure:
- `GEMINI_API_KEY`: Your Google Gemini API Key
- `SUPABASE_URL` / `SUPABASE_KEY`: (Optional) Supabase credentials
- `PORT`: `8000` (Default, leaving existing n8n untouched)

### 3. Run FastAPI Server

```bash
# From repository root with PYTHONPATH
$env:PYTHONPATH="backend_fastapi"
backend_fastapi\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The interactive API documentation will be available at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health`

### 4. Run Automated Tests

```bash
$env:PYTHONPATH="backend_fastapi"
backend_fastapi\.venv\Scripts\python.exe -m pytest backend_fastapi/tests -v
```
