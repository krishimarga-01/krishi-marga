"""
KRISHI MARGA — GENERALIZED ONNX EXPORT & VALIDATION
STATUS: READY TO RUN — nothing executes on import.

Exports the trained checkpoint for --crop to ONNX, preserving the
verified mobile contract exactly:
    input  : [1, 3, 224, 224], NCHW, float32, RGB, ImageNet mean/std
    output : softmax probabilities, one per class

Writes to training_output/onnx_candidates/<crop>/disease.onnx —
NEVER to assets/models/<crop>/disease.onnx (the live app path). See
README.md "Promoting a candidate model" for the manual, explicit step
that would ever touch the live path.
"""

import argparse
import json
import os
import time

import numpy as np

from pipeline_config import (
    DATA_PROCESSED_DIR, CHECKPOINT_DIR, ONNX_CANDIDATE_DIR, METADATA_DIR, REPORTS_DIR,
    IMAGENET_MEAN, IMAGENET_STD, ONNX_OPSET, ONNX_INPUT_NAME, ONNX_OUTPUT_NAME,
    RN_SUPPORTED_OP_ALLOWLIST, INPUT_SHAPE,
)


def _lazy_imports():
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader
    from torchvision import transforms, models, datasets
    import onnx
    import onnxruntime as ort
    return torch, nn, DataLoader, transforms, models, datasets, onnx, ort


def build_model(arch, num_classes, torch, nn, models):
    if arch == "mobilenet_v3_small":
        m = models.mobilenet_v3_small(weights=None)
        m.classifier[3] = nn.Linear(m.classifier[3].in_features, num_classes)
    elif arch == "mobilenet_v3_large":
        m = models.mobilenet_v3_large(weights=None)
        m.classifier[3] = nn.Linear(m.classifier[3].in_features, num_classes)
    elif arch == "efficientnet_lite0_proxy":
        m = models.efficientnet_b0(weights=None)
        m.classifier[1] = nn.Linear(m.classifier[1].in_features, num_classes)
    else:
        raise ValueError(f"Unsupported architecture: {arch}")
    return m


def main():
    parser = argparse.ArgumentParser(description="Export a trained crop model to ONNX and validate it")
    parser.add_argument("--crop", required=True)
    parser.add_argument("--arch", default="mobilenet_v3_small")
    parser.add_argument("--checkpoint", default=None, help="Override checkpoint path")
    args = parser.parse_args()

    torch, nn, DataLoader, transforms, models, datasets, onnx, ort = _lazy_imports()

    ckpt_path = args.checkpoint or os.path.join(CHECKPOINT_DIR, f"{args.crop}_{args.arch}_best.pth")
    if not os.path.exists(ckpt_path):
        raise FileNotFoundError(f"{ckpt_path} not found. Run train_crop_model.py first.")

    checkpoint = torch.load(ckpt_path, map_location="cpu")
    classes = checkpoint["classes"]
    num_classes = len(classes)

    base_model = build_model(args.arch, num_classes, torch, nn, models)
    base_model.load_state_dict(checkpoint["state_dict"])
    base_model.eval()
    print(f"[+] Loaded checkpoint: {ckpt_path}  ({num_classes} classes: {classes})")

    class OnnxWrapper(nn.Module):
        def __init__(self, m):
            super().__init__()
            self.m = m

        def forward(self, x):
            return torch.softmax(self.m(x), dim=1)

    wrapped = OnnxWrapper(base_model)
    wrapped.eval()

    out_dir = os.path.join(ONNX_CANDIDATE_DIR, args.crop)
    os.makedirs(out_dir, exist_ok=True)
    onnx_path = os.path.join(out_dir, "disease.onnx")
    dummy_input = torch.randn(*INPUT_SHAPE)

    print(f"[*] Exporting to ONNX (opset {ONNX_OPSET}) -> {onnx_path}")
    torch.onnx.export(
        wrapped, dummy_input, onnx_path,
        export_params=True, opset_version=ONNX_OPSET, do_constant_folding=True,
        input_names=[ONNX_INPUT_NAME], output_names=[ONNX_OUTPUT_NAME],
        dynamic_axes={ONNX_INPUT_NAME: {0: "batch_size"}, ONNX_OUTPUT_NAME: {0: "batch_size"}},
    )
    fp32_size = os.path.getsize(onnx_path)
    print(f"[+] Exported: {onnx_path} ({fp32_size/1024/1024:.2f} MB)")

    # ---- Structural validation ----
    onnx_model = onnx.load(onnx_path)
    onnx.checker.check_model(onnx_model)
    print("[+] onnx.checker.check_model PASSED")

    graph_ops = {node.op_type for node in onnx_model.graph.node}
    unsupported = graph_ops - RN_SUPPORTED_OP_ALLOWLIST
    if unsupported:
        print(f"[!] WARNING: ops not on the onnxruntime-react-native allow-list: {sorted(unsupported)}")
        print("    This does not necessarily mean it will fail on-device — verify with the "
              "mobile compatibility smoke test in README.md before promoting this candidate.")
    else:
        print(f"[+] All graph ops ({sorted(graph_ops)}) are on the RN-compatible allow-list")

    # ---- Contract shape check ----
    inp = onnx_model.graph.input[0]
    dims = [d.dim_value if d.dim_value > 0 else -1 for d in inp.type.tensor_type.shape.dim]
    contract_ok = dims[1:] == list(INPUT_SHAPE[1:])
    print(f"[{'✓' if contract_ok else '✗'}] Input tensor dims (batch,C,H,W) = {dims} "
          f"vs expected [*,{INPUT_SHAPE[1]},{INPUT_SHAPE[2]},{INPUT_SHAPE[3]}]")
    if not contract_ok:
        raise RuntimeError("Exported ONNX does not match the mobile input contract — refusing to proceed.")

    # ---- Numerical equivalence vs PyTorch on real test images ----
    data_dir = os.path.join(DATA_PROCESSED_DIR, args.crop, "test")
    max_diff = None
    prob_sum = None
    has_nan_inf = None
    if os.path.isdir(data_dir):
        eval_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=list(IMAGENET_MEAN), std=list(IMAGENET_STD)),
        ])
        test_dataset = datasets.ImageFolder(data_dir, transform=eval_transform)
        if len(test_dataset) > 0:
            ort_session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
            input_name = ort_session.get_inputs()[0].name
            output_name = ort_session.get_outputs()[0].name

            diffs = []
            n_check = min(5, len(test_dataset))
            for i in range(n_check):
                img, _ = test_dataset[i]
                batch = img.unsqueeze(0)
                with torch.no_grad():
                    pt_out = wrapped(batch).numpy()
                ort_out = ort_session.run([output_name], {input_name: batch.numpy()})[0]
                diffs.append(float(np.max(np.abs(pt_out - ort_out))))
            max_diff = max(diffs)
            sample_ort = ort_session.run([output_name], {input_name: test_dataset[0][0].unsqueeze(0).numpy()})[0]
            has_nan_inf = bool(np.isnan(sample_ort).any() or np.isinf(sample_ort).any())
            prob_sum = float(np.sum(sample_ort))

            latencies = []
            sample_input = {input_name: test_dataset[0][0].unsqueeze(0).numpy()}
            for _ in range(50):
                t0 = time.perf_counter()
                ort_session.run([output_name], sample_input)
                latencies.append((time.perf_counter() - t0) * 1000)
            mean_lat, p95_lat = float(np.mean(latencies)), float(np.percentile(latencies, 95))

            print(f"[*] PyTorch vs ONNX max abs diff: {max_diff:.8f} "
                  f"({'PASS' if max_diff < 1e-4 else 'CHECK'} atol=1e-4)")
            print(f"[*] Softmax sums to {prob_sum:.6f} | NaN/Inf: {has_nan_inf}")
            print(f"[*] CPU latency: mean {mean_lat:.2f} ms | p95 {p95_lat:.2f} ms")
        else:
            mean_lat = p95_lat = None
            print("[!] Test split is empty — skipping numerical-equivalence/latency checks.")
    else:
        mean_lat = p95_lat = None
        print(f"[!] {data_dir} not found — skipping numerical-equivalence/latency checks.")

    metadata = {
        "crop": args.crop,
        "architecture": args.arch,
        "input_tensor": {"name": ONNX_INPUT_NAME, "shape": list(INPUT_SHAPE), "dtype": "float32",
                          "layout": "NCHW", "normalization": {"mean": list(IMAGENET_MEAN), "std": list(IMAGENET_STD)}},
        "output_tensor": {"name": ONNX_OUTPUT_NAME, "shape": [1, num_classes], "activation": "Softmax"},
        "classes": classes,
        "onnx_opset": ONNX_OPSET,
        "file_size_bytes": fp32_size,
        "graph_ops": sorted(graph_ops),
        "unsupported_rn_ops": sorted(unsupported),
        "numerical_equivalence": {"max_abs_diff": max_diff, "softmax_sum": prob_sum, "has_nan_or_inf": has_nan_inf},
        "latency_ms": {"mean": mean_lat, "p95": p95_lat},
        "onnx_candidate_path": onnx_path,
        "status": "CANDIDATE — NOT PROMOTED TO LIVE ASSETS",
    }
    os.makedirs(METADATA_DIR, exist_ok=True)
    meta_path = os.path.join(METADATA_DIR, f"{args.crop}_onnx_candidate_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[+] Candidate metadata written: {meta_path}")
    print(f"[!] Next: python optimize_onnx.py --crop {args.crop}")


if __name__ == "__main__":
    main()
