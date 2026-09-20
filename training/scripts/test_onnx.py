"""
Krishi Marga — ONNX Model Testing Utility
Runs real test image through exported ONNX model using ONNX Runtime.
Preprocesses using exact ImageNet normalization and outputs predicted crop,
disease condition, and Top-3 confidence levels.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from PIL import Image
import numpy as np
import onnxruntime as ort

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum(axis=-1, keepdims=True)

def parse_class_label(raw_class):
    """Separates class label into Crop and Disease components"""
    if '___' in raw_class:
        parts = raw_class.split('___')
        return parts[0].replace('_', ' ').strip(), parts[1].replace('_', ' ').strip()
    elif ' - ' in raw_class:
        parts = raw_class.split(' - ')
        return parts[0].strip(), parts[1].strip()
    return "General Crop", raw_class.replace('_', ' ').strip()

def test_onnx_model(model_path, image_path, class_names_path=None):
    model_path = Path(model_path).resolve()
    image_path = Path(image_path).resolve()

    if not model_path.exists():
        print(f"[ERROR] ONNX Model not found at: {model_path}")
        sys.exit(1)

    if not image_path.exists():
        print(f"[ERROR] Image file not found at: {image_path}")
        sys.exit(1)

    base_dir = Path(__file__).parent.parent
    if class_names_path is None:
        class_names_path = base_dir / "outputs" / "class_names.json"
    else:
        class_names_path = Path(class_names_path).resolve()

    class_names = {}
    if class_names_path.exists():
        with open(class_names_path, "r", encoding="utf-8") as f:
            class_names = json.load(f)

    # 1. Load ONNX Runtime Session
    session = ort.InferenceSession(str(model_path), providers=['CPUExecutionProvider'])
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name

    # 2. Preprocess Image (Matching Krishi Marga TENSOR_SPEC)
    # Resize 224x224, RGB, Normalize: (pixel/255 - mean) / std
    with Image.open(image_path) as img:
        img = img.convert('RGB')
        # Center crop / resize to 224x224
        img = img.resize((224, 224), Image.BILINEAR)
        img_arr = np.array(img, dtype=np.float32) / 255.0

    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    normalized = (img_arr - mean) / std

    # Transpose to NCHW: [1, 3, 224, 224]
    input_tensor = np.transpose(normalized, (2, 0, 1))
    input_tensor = np.expand_dims(input_tensor, axis=0).astype(np.float32)

    # 3. Run Inference
    outputs = session.run([output_name], {input_name: input_tensor})[0]
    logits = outputs[0]
    probs = softmax(logits)

    # Top predictions
    top_indices = np.argsort(probs)[::-1][:min(3, len(probs))]
    best_idx = top_indices[0]
    best_class = class_names.get(str(best_idx), f"Class_{best_idx}")
    best_conf = float(probs[best_idx]) * 100

    crop, disease = parse_class_label(best_class)

    print("\n" + "=" * 60)
    print("        KRISHI MARGA — ONNX INFERENCE TEST RESULT           ")
    print("=" * 60)
    print(f"Tested Image: {image_path.name}")
    print(f"Model File  : {model_path.name}")
    print("-" * 60)
    print(f"\U0001f3c6 TOP PREDICTION:")
    print(f"   Crop       : {crop}")
    print(f"   Condition  : {disease}")
    print(f"   Confidence : {best_conf:.1f}%")
    print("-" * 60)
    print("\U0001f4ca TOP-3 RANKED PREDICTIONS:")
    for rank, idx in enumerate(top_indices, 1):
        c_name = class_names.get(str(idx), f"Class_{idx}")
        c_crop, c_dis = parse_class_label(c_name)
        p = float(probs[idx]) * 100
        print(f"   {rank}. {c_crop} - {c_dis} ({p:.1f}%)")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test ONNX model with a leaf photo")
    parser.add_argument("--model", type=str, required=True, help="Path to .onnx model")
    parser.add_argument("--image", type=str, required=True, help="Path to test leaf image (.jpg/.png)")
    parser.add_argument("--classes", type=str, default=None, help="Path to class_names.json")
    args = parser.parse_args()
    test_onnx_model(args.model, args.image, args.classes)
