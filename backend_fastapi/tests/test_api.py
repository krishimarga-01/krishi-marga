import io
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SAMPLE_IMAGE = PROJECT_ROOT / "test_leaf.jpg"

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "onnx_models_loaded" in data
    assert data["onnx_models_loaded"] > 0

def test_detect_disease_ping():
    response = client.post(
        "/webhook/detect-disease",
        json={"ping": True}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["ping"] == "pong"

def test_detect_disease_no_images():
    response = client.post(
        "/webhook/detect-disease",
        data={"crop": "tomato", "language": "en"}
    )
    # When no images provided, FastAPI/n8n rejects request
    assert response.status_code in [400, 422]

def test_detect_disease_invalid_crop():
    with open(SAMPLE_IMAGE, "rb") as f:
        img_bytes = f.read()

    response = client.post(
        "/webhook/detect-disease",
        data={"crop": "nonexistent_crop", "language": "en"},
        files={"images": ("leaf.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["errorCode"] == "UNSUPPORTED_CROP"
    assert "requestId" in data

def test_detect_disease_valid_request():
    with open(SAMPLE_IMAGE, "rb") as f:
        img_bytes = f.read()

    response = client.post(
        "/webhook/detect-disease",
        data={"crop": "tomato", "language": "en"},
        files={"images": ("leaf.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "requestId" in data
    assert "timestamp" in data
    assert "model_provider" in data
    assert "result" in data
    result = data["result"]
    assert result["crop"] == "tomato"
    assert "health_status" in result
    assert "disease" in result
    assert "confidence" in result
    assert "symptoms" in result
    assert "recommendations" in result

def test_scan_pesticide_endpoint():
    with open(SAMPLE_IMAGE, "rb") as f:
        img_bytes = f.read()

    response = client.post(
        "/webhook/scan-pesticide",
        data={"language": "en", "crop": "tomato"},
        files={"images": ("label.jpg", img_bytes, "image/jpeg")}
    )
    # Returns 200 OK envelope even if model unconfigured or fails
    assert response.status_code == 200
    data = response.json()
    assert "requestId" in data
    assert data.get("scan_type") == "pesticide"

def test_legacy_pesticide_via_detect_disease():
    with open(SAMPLE_IMAGE, "rb") as f:
        img_bytes = f.read()

    response = client.post(
        "/webhook/detect-disease",
        data={"scan_type": "pesticide", "language": "en", "crop": "tomato"},
        files={"images": ("label.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "requestId" in data
    assert data.get("scan_type") == "pesticide"

