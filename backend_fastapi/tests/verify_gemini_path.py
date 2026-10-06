from unittest.mock import patch, AsyncMock
from pathlib import Path
from fastapi.testclient import TestClient
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend_fastapi"))

from app.main import app

client = TestClient(app)
SAMPLE_IMAGE = PROJECT_ROOT / "test_leaf.jpg"

def test_gemini_result_path():
    # Simulated Gemini response matching what Gemini actually returns
    mock_gemini_data = {
        "crop": "tomato",
        "health_status": "Diseased",
        "disease": "Early Blight",
        "confidence": 0.88,
        "severity": "Moderate",
        "problem_type": "DISEASE",
        "symptoms": ["Dark brown circular spots on lower leaves with concentric rings"],
        "recommendations": ["Apply Copper Oxychloride 50 WP @ 3g/L or Mancozeb 75 WP @ 2g/L"],
        "prevention": ["Crop rotation and avoid overhead sprinkler irrigation"],
        "regional_advice": "Consult local KVK or RSK officer for regional advisory in Karnataka",
        "user_message": "Early Blight detected on tomato with 88% confidence. Begin fungicide spray."
    }

    with patch("app.services.gemini_service.gemini_service.diagnose_crop", new_callable=AsyncMock) as mock_diagnose:
        mock_diagnose.return_value = (mock_gemini_data, "gemini-3.5-flash-lite")

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
        assert data["model_provider"] == "gemini-3.5-flash-lite"
        assert data["result"]["crop"] == "tomato"
        assert data["result"]["health_status"] == "Diseased"
        assert data["result"]["disease"] == "Early Blight"
        assert data["result"]["confidence"] == 0.88
        assert data["result"]["confidence_level"] == "High"
        assert data["result"]["problem_type"] == "DISEASE"
        assert len(data["result"]["symptoms"]) == 1
        assert len(data["result"]["recommendations"]) == 1
        print("GEMINI RESULT PATH VERIFICATION: PASSED (Exact envelope and schema match!)")

if __name__ == "__main__":
    test_gemini_result_path()
