import os
from pathlib import Path
import pytest
from app.services.onnx_service import onnx_service

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SAMPLE_IMAGE = PROJECT_ROOT / "test_leaf.jpg"

def test_onnx_models_loaded():
    assert len(onnx_service.sessions) > 0
    assert onnx_service.is_crop_supported("tomato")
    assert onnx_service.is_crop_supported("chilli")
    assert onnx_service.is_crop_supported("paddy")

def test_onnx_inference():
    if not SAMPLE_IMAGE.exists():
        pytest.skip("Sample image test_leaf.jpg not found")

    with open(SAMPLE_IMAGE, "rb") as f:
        img_bytes = f.read()

    result = onnx_service.infer("tomato", img_bytes)
    assert result is not None
    assert result["crop"] == "tomato"
    assert "health_status" in result
    assert "confidence" in result
    assert 0.0 <= result["confidence"] <= 1.0
    assert "disease" in result
    assert "symptoms" in result
    assert "recommendations" in result
    assert result["is_offline"] is True
