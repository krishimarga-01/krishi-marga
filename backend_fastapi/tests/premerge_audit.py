import os
import sys
import time
from pathlib import Path
import httpx
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend_fastapi"))

from app.main import app
from fastapi.testclient import TestClient

load_dotenv(PROJECT_ROOT / ".env")

n8n_url = os.getenv("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
fastapi_client = TestClient(app)
SAMPLE_IMAGE = PROJECT_ROOT / "test_leaf.jpg"

def run_premerge_audit():
    print("=" * 80)
    print("FINAL PRE-MERGE VERIFICATION AUDIT")
    print("=" * 80)
    print(f"Sample Image Path: {SAMPLE_IMAGE}")
    assert SAMPLE_IMAGE.exists(), "Sample image test_leaf.jpg not found!"

    with open(SAMPLE_IMAGE, "rb") as f:
        img_bytes = f.read()

    # 1. FastAPI Disease Request
    print("\n[1] Testing FastAPI Disease Endpoint (POST /webhook/detect-disease)...")
    t0 = time.time()
    fa_resp = fastapi_client.post(
        "/webhook/detect-disease",
        data={"crop": "tomato", "language": "en", "scan_type": "disease"},
        files={"images": ("leaf.jpg", img_bytes, "image/jpeg")}
    )
    fa_lat = int((time.time() - t0) * 1000)
    fa_data = fa_resp.json()
    print(f"  HTTP Status       : {fa_resp.status_code}")
    print(f"  Latency           : {fa_lat} ms")
    print(f"  Success           : {fa_data.get('success')}")
    print(f"  Request ID        : {fa_data.get('requestId')}")
    print(f"  Model Provider    : {fa_data.get('model_provider')}")
    print(f"  Used ONNX Fallback: {'Yes' if 'ONNX' in str(fa_data.get('model_provider')) else 'No'}")
    if fa_data.get("result"):
        r = fa_data["result"]
        print(f"  Diagnosis         : {r.get('disease')}")
        print(f"  Health Status     : {r.get('health_status')}")
        print(f"  Confidence        : {r.get('confidence')} ({r.get('confidence_level')})")
        print(f"  Severity          : {r.get('severity')}")
        print(f"  Problem Type      : {r.get('problem_type')}")

    # 2. FastAPI Pesticide Request
    print("\n[2] Testing FastAPI Pesticide Endpoint (POST /webhook/scan-pesticide)...")
    t0 = time.time()
    pest_resp = fastapi_client.post(
        "/webhook/scan-pesticide",
        data={"crop": "tomato", "language": "en", "scan_type": "pesticide"},
        files={"images": ("label.jpg", img_bytes, "image/jpeg")}
    )
    pest_lat = int((time.time() - t0) * 1000)
    pest_data = pest_resp.json()
    print(f"  HTTP Status       : {pest_resp.status_code}")
    print(f"  Latency           : {pest_lat} ms")
    print(f"  Success           : {pest_data.get('success')}")
    print(f"  Scan Type         : {pest_data.get('scan_type')}")
    print(f"  Request ID        : {pest_data.get('requestId')}")
    print(f"  ErrorCode         : {pest_data.get('errorCode')}")
    print(f"  Message           : {pest_data.get('message')}")

    # 3. Live n8n Disease Request
    print(f"\n[3] Testing Live n8n Endpoint ({n8n_url})...")
    try:
        t0 = time.time()
        with httpx.Client(timeout=30.0) as http_client:
            n8n_resp = http_client.post(
                n8n_url,
                data={"crop": "tomato", "language": "en", "scan_type": "disease"},
                files={"images": ("leaf.jpg", img_bytes, "image/jpeg")}
            )
        n8n_lat = int((time.time() - t0) * 1000)
        n8n_data = n8n_resp.json()
        print(f"  HTTP Status       : {n8n_resp.status_code}")
        print(f"  Latency           : {n8n_lat} ms")
        print(f"  Success           : {n8n_data.get('success')}")
        print(f"  Request ID        : {n8n_data.get('requestId')}")
        print(f"  Model Provider    : {n8n_data.get('model_provider')}")
        if n8n_data.get("result"):
            r = n8n_data["result"]
            print(f"  Diagnosis         : {r.get('disease')}")
            print(f"  Health Status     : {r.get('health_status')}")
            print(f"  Confidence        : {r.get('confidence')} ({r.get('confidence_level')})")
            print(f"  Severity          : {r.get('severity')}")
            print(f"  Problem Type      : {r.get('problem_type')}")
    except Exception as e:
        print(f"  Live n8n call encountered error: {e}")

    print("\n" + "=" * 80)
    print("END PRE-MERGE AUDIT EXECUTION")
    print("=" * 80)

if __name__ == "__main__":
    run_premerge_audit()
