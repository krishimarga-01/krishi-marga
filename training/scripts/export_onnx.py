"""
Krishi Marga — ONNX Export & Verification Engine
Exports PyTorch model checkpoint to ONNX format ([1, 3, 224, 224] RGB float32).
Validates ONNX graph and cross-verifies output parity with PyTorch.
"""

import os
import sys
import json
import argparse
from pathlib import Path

import torch
import numpy as np
import onnx
import onnxruntime as ort
from torchvision import models

def export_to_onnx(checkpoint_path=None, output_onnx_path=None, opset_version=17):
    base_dir = Path(__file__).parent.parent
    if checkpoint_path is None:
        checkpoint_path = base_dir / "models" / "checkpoints" / "best_model.pth"
    else:
        checkpoint_path = Path(checkpoint_path).resolve()

    if not checkpoint_path.exists():
        print(f"[ERROR] Checkpoint not found: {checkpoint_path}")
        sys.exit(1)

    if output_onnx_path is None:
        output_onnx_path = base_dir / "models" / "onnx" / "krishi_marga_disease_model.onnx"
    else:
        output_onnx_path = Path(output_onnx_path).resolve()

    output_onnx_path.parent.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print("         KRISHI MARGA — ONNX EXPORT & GRAPH VERIFICATION     ")
    print("=" * 65)
    print(f"Loading PyTorch checkpoint: {checkpoint_path.name}")
    checkpoint = torch.load(checkpoint_path, map_location='cpu')

    num_classes = checkpoint['num_classes']
    arch = checkpoint.get('arch', 'mobilenet_v3_small')
    class_names = checkpoint.get('class_names', {})

    # Reconstruct model
    if arch == 'mobilenet_v3_small':
        model = models.mobilenet_v3_small(weights=None)
        in_features = model.classifier[3].in_features
        model.classifier[3] = torch.nn.Linear(in_features, num_classes)
    elif arch == 'mobilenet_v2':
        model = models.mobilenet_v2(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier[1] = torch.nn.Linear(in_features, num_classes)
    else:
        print(f"[ERROR] Unsupported architecture: {arch}")
        sys.exit(1)

    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    # Create representative dummy input matching Krishi Marga TENSOR_SPEC
    # Shape: [1, 3, 224, 224] float32 NCHW
    dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)

    print(f"[EXPORT] Exporting to ONNX (Opset: {opset_version})...")
    torch.onnx.export(
        model,
        dummy_input,
        str(output_onnx_path),
        export_params=True,
        opset_version=opset_version,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )

    model_size_mb = os.path.getsize(output_onnx_path) / (1024 * 1024)
    print(f"[EXPORT] Successfully generated ONNX model: {output_onnx_path.name} ({model_size_mb:.2f} MB)")

    # 1. Validate ONNX structure
    print("[CHECK] Validating ONNX graph integrity with onnx.checker...")
    onnx_model = onnx.load(str(output_onnx_path))
    onnx.checker.check_model(onnx_model)
    print("[CHECK] ONNX graph is structurally VALID.")

    # 2. Cross-verify with ONNX Runtime
    print("[CHECK] Running cross-parity verification between PyTorch & ONNX Runtime...")
    ort_session = ort.InferenceSession(str(output_onnx_path), providers=['CPUExecutionProvider'])

    with torch.no_grad():
        torch_out = model(dummy_input).numpy()

    ort_inputs = {ort_session.get_inputs()[0].name: dummy_input.numpy()}
    ort_out = ort_session.run(None, ort_inputs)[0]

    max_diff = np.max(np.abs(torch_out - ort_out))
    print(f"[PARITY] Maximum output difference: {max_diff:.6e}")
    if max_diff > 1e-4:
        print("[WARNING] Difference between PyTorch and ONNX exceeds 1e-4 tolerance!")
    else:
        print("[SUCCESS] Output parity verified (within 1e-4 numerical tolerance).")

    # 3. Save Model Metadata
    out_dir = base_dir / "outputs"
    out_dir.mkdir(parents=True, exist_ok=True)
    metadata = {
        "model_name": output_onnx_path.name,
        "architecture": arch,
        "num_classes": num_classes,
        "input_shape": [1, 3, 224, 224],
        "input_name": "input",
        "output_name": "output",
        "data_type": "float32",
        "normalization": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225]
        },
        "classes": class_names,
        "model_size_mb": round(model_size_mb, 2),
        "opset": opset_version
    }
    with open(out_dir / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[SAVED] Model metadata saved to: {out_dir / 'model_metadata.json'}")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export PyTorch model to ONNX")
    parser.add_argument("--checkpoint", type=str, default=None, help="Path to .pth checkpoint")
    parser.add_argument("--output", type=str, default=None, help="Destination .onnx file path")
    parser.add_argument("--opset", type=int, default=17, help="ONNX opset version")
    args = parser.parse_args()
    export_to_onnx(args.checkpoint, args.output, args.opset)
