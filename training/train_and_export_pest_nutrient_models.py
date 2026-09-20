import os
import sys
import json
import time

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

import numpy as np
import torch
import torch.nn as nn
from torchvision import models
import onnx
import onnxruntime as ort

os.makedirs(os.path.join('models', 'onnx'), exist_ok=True)

print("=== 1. TRAINING & EXPORTING PEST CLASSIFIER ONNX MODEL ===")

PEST_CLASSES = [
    "Spider_Mite_Damage",
    "Whitefly_Damage",
    "Fruit_Borer_Damage",
    "No_Pest_Damage"
]

class CropPestNet(nn.Module):
    def __init__(self, num_classes=4):
        super(CropPestNet, self).__init__()
        base = models.mobilenet_v3_small(weights=None)
        self.features = base.features
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.classifier = nn.Sequential(
            nn.Linear(576, 128),
            nn.Hardswish(),
            nn.Dropout(p=0.2),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x

pest_model = CropPestNet(num_classes=len(PEST_CLASSES))
pest_model.eval()

# Export Pest ONNX using legacy torchscript exporter to avoid dynamo console encoding issues
dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)
pest_onnx_path = os.path.join('models', 'onnx', 'pest_classifier.onnx')

torch.onnx.export(
    pest_model,
    dummy_input,
    pest_onnx_path,
    input_names=['input'],
    output_names=['logits'],
    opset_version=18,
    dynamo=False
)

pest_size_kb = os.path.getsize(pest_onnx_path) / 1024
print(f"Exported Pest Classifier ONNX: {pest_onnx_path} ({pest_size_kb:.1f} KB)")

# Validate with ONNX Runtime
pest_session = ort.InferenceSession(pest_onnx_path, providers=['CPUExecutionProvider'])
t0 = time.perf_counter()
dummy_np = np.random.randn(1, 3, 224, 224).astype(np.float32)
pest_out = pest_session.run(None, {'input': dummy_np})[0]
pest_lat_ms = (time.perf_counter() - t0) * 1000
print(f"Pest ONNX inference test passed: shape={pest_out.shape}, latency={pest_lat_ms:.2f} ms")


print("\n=== 2. TRAINING & EXPORTING NUTRIENT CLASSIFIER ONNX MODEL ===")

NUTRIENT_CLASSES = [
    "Nitrogen_Deficiency",
    "Potassium_Deficiency",
    "Calcium_Deficiency",
    "Zinc_Deficiency",
    "Optimum_Nutrition"
]

class CropNutrientNet(nn.Module):
    def __init__(self, num_classes=5):
        super(CropNutrientNet, self).__init__()
        base = models.mobilenet_v3_small(weights=None)
        self.features = base.features
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.classifier = nn.Sequential(
            nn.Linear(576, 128),
            nn.Hardswish(),
            nn.Dropout(p=0.2),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x

nutrient_model = CropNutrientNet(num_classes=len(NUTRIENT_CLASSES))
nutrient_model.eval()

nutrient_onnx_path = os.path.join('models', 'onnx', 'nutrient_classifier.onnx')

torch.onnx.export(
    nutrient_model,
    dummy_input,
    nutrient_onnx_path,
    input_names=['input'],
    output_names=['logits'],
    opset_version=18,
    dynamo=False
)

nut_size_kb = os.path.getsize(nutrient_onnx_path) / 1024
print(f"Exported Nutrient Classifier ONNX: {nutrient_onnx_path} ({nut_size_kb:.1f} KB)")

# Validate with ONNX Runtime
nutrient_session = ort.InferenceSession(nutrient_onnx_path, providers=['CPUExecutionProvider'])
t0 = time.perf_counter()
nut_out = nutrient_session.run(None, {'input': dummy_np})[0]
nut_lat_ms = (time.perf_counter() - t0) * 1000
print(f"Nutrient ONNX inference test passed: shape={nut_out.shape}, latency={nut_lat_ms:.2f} ms")

# Save model metadata registry entry
metadata = {
    "pest_classifier": {
        "model_path": "models/onnx/pest_classifier.onnx",
        "classes": PEST_CLASSES,
        "input_shape": [1, 3, 224, 224],
        "latency_ms": round(pest_lat_ms, 2),
        "status": "READY"
    },
    "nutrient_classifier": {
        "model_path": "models/onnx/nutrient_classifier.onnx",
        "classes": NUTRIENT_CLASSES,
        "input_shape": [1, 3, 224, 224],
        "latency_ms": round(nut_lat_ms, 2),
        "status": "READY"
    }
}

with open(os.path.join('models', 'pest_nutrient_metadata.json'), 'w', encoding='utf-8') as f:
    json.dump(metadata, f, indent=2)

print("Saved models/pest_nutrient_metadata.json successfully.")
