import io
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
from PIL import Image
import onnxruntime as ort
from app.core.config import settings

logger = logging.getLogger(__name__)

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)
PAD_VALUE = 114.0 / 255.0

class OnnxInferenceService:
    def __init__(self, models_dir: Optional[str] = None):
        self.models_dir = Path(models_dir or settings.ONNX_MODELS_DIR)
        self.sessions: Dict[str, ort.InferenceSession] = {}
        self.labels: Dict[str, List[str]] = {}
        self._load_available_models()

    def _load_available_models(self):
        if not self.models_dir.exists():
            logger.warning(f"ONNX models directory does not exist: {self.models_dir}")
            return

        for crop_dir in self.models_dir.iterdir():
            if crop_dir.is_dir():
                crop_name = crop_dir.name.lower()
                model_file = crop_dir / "model.onnx"
                labels_file = crop_dir / "labels.json"

                if model_file.exists() and labels_file.exists():
                    try:
                        with open(labels_file, "r", encoding="utf-8") as f:
                            labels_data = json.load(f)
                            if isinstance(labels_data, list):
                                labels = labels_data
                            elif isinstance(labels_data, dict):
                                labels = [labels_data[str(i)] for i in range(len(labels_data))]
                            else:
                                labels = []

                        sess_options = ort.SessionOptions()
                        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
                        session = ort.InferenceSession(str(model_file), sess_options, providers=["CPUExecutionProvider"])
                        
                        self.sessions[crop_name] = session
                        self.labels[crop_name] = labels
                        logger.info(f"Loaded ONNX model for crop: {crop_name} with {len(labels)} classes")
                    except Exception as e:
                        logger.warning(f"Could not load ONNX model for {crop_name}: {e}")

    def is_crop_supported(self, crop: str) -> bool:
        return crop.lower() in self.sessions

    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        w, h = image.size
        
        # Letterbox aspect preservation to 224x224
        target_size = 224
        scale = min(target_size / w, target_size / h)
        nw, nh = int(w * scale), int(h * scale)
        image_resized = image.resize((nw, nh), Image.Resampling.BILINEAR)

        # Pad canvas with 114/255
        canvas = Image.new("RGB", (target_size, target_size), (114, 114, 114))
        paste_x = (target_size - nw) // 2
        paste_y = (target_size - nh) // 2
        canvas.paste(image_resized, (paste_x, paste_y))

        # Convert to float32 [0, 1]
        arr = np.array(canvas, dtype=np.float32) / 255.0
        
        # HWC -> CHW (3, 224, 224)
        arr = arr.transpose((2, 0, 1))
        
        # Normalize
        arr = (arr - MEAN) / STD
        
        # Add batch dim -> (1, 3, 224, 224)
        arr = np.expand_dims(arr, axis=0).astype(np.float32)
        return arr

    def infer(self, crop: str, image_bytes: bytes) -> Optional[Dict[str, Any]]:
        crop_clean = crop.lower()
        if crop_clean not in self.sessions:
            return None

        session = self.sessions[crop_clean]
        labels = self.labels[crop_clean]

        input_tensor = self.preprocess_image(image_bytes)
        input_name = session.get_inputs()[0].name
        
        outputs = session.run(None, {input_name: input_tensor})
        logits = outputs[0][0]
        
        # Softmax
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / np.sum(exp_logits)
        
        top_idx = int(np.argmax(probs))
        top_conf = float(probs[top_idx])
        top_label = labels[top_idx] if top_idx < len(labels) else "Unknown"

        is_healthy = "healthy" in top_label.lower()
        health_status = "Healthy" if is_healthy else ("Uncertain" if top_conf < 0.50 else "Diseased")
        disease_name = "None" if is_healthy else top_label
        confidence_level = "High" if top_conf >= 0.75 else ("Medium" if top_conf >= 0.50 else "Low")
        problem_type = "HEALTHY" if is_healthy else ("UNKNOWN" if top_conf < 0.50 else "DISEASE")

        return {
            "crop": crop,
            "health_status": health_status,
            "disease": disease_name,
            "confidence": round(top_conf, 2),
            "confidence_level": confidence_level,
            "severity": "None" if is_healthy else "Moderate",
            "problem_type": problem_type,
            "symptoms": [f"Observed visual leaf symptoms indicative of {top_label}"] if not is_healthy else ["Healthy foliage"],
            "recommendations": ["Follow standard agronomic best practices and preventive management."] if not is_healthy else ["Maintain optimal irrigation and nutrition."],
            "prevention": ["Regular crop monitoring and field sanitation."],
            "regional_advice": "Consult local Krishi Vigyan Kendra (KVK) for localized chemical recommendations.",
            "user_message": f"Edge inference identified {disease_name} with {int(top_conf * 100)}% confidence.",
            "is_offline": True,
            "model_name": f"Krishi-ONNX-{crop_clean.capitalize()}"
        }

onnx_service = OnnxInferenceService()
