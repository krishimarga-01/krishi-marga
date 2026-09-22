"""
KRISHI MARGA — ONNX MOBILE OPTIMIZATION & SAFETY-GATED COMPARISON
STATUS: READY TO RUN — nothing executes on import.

Takes the FP32 candidate ONNX produced by export_and_validate_onnx.py and:
  1. Runs ONNX Runtime graph optimization (constant folding, node fusion)
  2. Applies dynamic INT8 quantization (onnxruntime.quantization)
  3. Optionally converts to FP16 (--fp16), when the environment's
     onnxruntime-react-native build is confirmed to support it —
     verify this yourself; FP16 mobile support is less universal
     than INT8, hence opt-in only.
  4. Re-validates accuracy on the held-out test set for every variant
  5. Compares FP32 vs optimized vs quantized sizes and accuracy
  6. Compares the BEST candidate against the existing live model's
     recorded metrics (if reports/model_evaluation_<crop>.json for
     the live model or its metadata exists) and refuses to recommend
     replacement unless the candidate is not worse.

This script never overwrites assets/models/<crop>/disease.onnx. It
only ever writes into training_output/onnx_candidates/<crop>/.
"""

import argparse
import json
import os

import numpy as np

from pipeline_config import (
    DATA_PROCESSED_DIR, ONNX_CANDIDATE_DIR, METADATA_DIR, REPORTS_DIR, LIVE_ASSETS_DIR,
    IMAGENET_MEAN, IMAGENET_STD, ONNX_INPUT_NAME, ONNX_OUTPUT_NAME,
)


def _lazy_imports():
    import onnx
    import onnxruntime as ort
    from onnxruntime.quantization import quantize_dynamic, QuantType
    from onnxruntime.transformers.optimizer import optimize_model as ort_optimize_model
    return onnx, ort, quantize_dynamic, QuantType, ort_optimize_model


def _evaluate_onnx_accuracy(onnx_path, crop, ort):
    """Runs the given ONNX model over the held-out test split, if present,
    and returns (accuracy, n_samples). Returns (None, 0) if no test data."""
    test_dir = os.path.join(DATA_PROCESSED_DIR, crop, "test")
    if not os.path.isdir(test_dir):
        return None, 0

    from PIL import Image

    classes = sorted(d for d in os.listdir(test_dir) if os.path.isdir(os.path.join(test_dir, d)))
    if not classes:
        return None, 0
    class_to_idx = {c: i for i, c in enumerate(classes)}

    session = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name

    mean = np.array(IMAGENET_MEAN, dtype=np.float32).reshape(3, 1, 1)
    std = np.array(IMAGENET_STD, dtype=np.float32).reshape(3, 1, 1)

    correct, total = 0, 0
    for cls in classes:
        cls_dir = os.path.join(test_dir, cls)
        for fname in os.listdir(cls_dir):
            if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            img = Image.open(os.path.join(cls_dir, fname)).convert("RGB").resize((224, 224))
            arr = np.asarray(img, dtype=np.float32).transpose(2, 0, 1) / 255.0
            arr = (arr - mean) / std
            batch = arr[np.newaxis, ...].astype(np.float32)
            probs = session.run([output_name], {input_name: batch})[0]
            pred = int(np.argmax(probs[0]))
            if pred == class_to_idx[cls]:
                correct += 1
            total += 1
    return (correct / total if total else None), total


def main():
    parser = argparse.ArgumentParser(description="Optimize + quantize a candidate ONNX model and gate promotion")
    parser.add_argument("--crop", required=True)
    parser.add_argument("--fp16", action="store_true", help="Also produce an FP16 variant (opt-in)")
    parser.add_argument("--accuracy-drop-tolerance", type=float, default=0.02,
                         help="Max acceptable accuracy drop (absolute) for the quantized model vs FP32")
    args = parser.parse_args()

    onnx, ort, quantize_dynamic, QuantType, ort_optimize_model = _lazy_imports()

    candidate_dir = os.path.join(ONNX_CANDIDATE_DIR, args.crop)
    fp32_path = os.path.join(candidate_dir, "disease.onnx")
    if not os.path.exists(fp32_path):
        raise FileNotFoundError(f"{fp32_path} not found. Run export_and_validate_onnx.py first.")

    fp32_size = os.path.getsize(fp32_path)
    print(f"[*] FP32 candidate: {fp32_path} ({fp32_size/1024/1024:.2f} MB)")

    # ---- Graph optimization (fusion, constant folding) ----
    optimized_path = os.path.join(candidate_dir, "disease.optimized.onnx")
    sess_options = ort.SessionOptions()
    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    sess_options.optimized_model_filepath = optimized_path
    _ = ort.InferenceSession(fp32_path, sess_options, providers=["CPUExecutionProvider"])
    optimized_size = os.path.getsize(optimized_path) if os.path.exists(optimized_path) else fp32_size
    print(f"[+] Graph-optimized: {optimized_path} ({optimized_size/1024/1024:.2f} MB)")

    # ---- INT8 dynamic quantization ----
    quantized_path = os.path.join(candidate_dir, "disease.int8.onnx")
    quantize_dynamic(optimized_path, quantized_path, weight_type=QuantType.QInt8)
    quantized_size = os.path.getsize(quantized_path)
    print(f"[+] INT8 quantized: {quantized_path} ({quantized_size/1024/1024:.2f} MB)")

    variants = {
        "fp32": {"path": fp32_path, "size_bytes": fp32_size},
        "optimized_fp32": {"path": optimized_path, "size_bytes": optimized_size},
        "quantized_int8": {"path": quantized_path, "size_bytes": quantized_size},
    }

    if args.fp16:
        try:
            from onnxconverter_common import float16
            fp16_path = os.path.join(candidate_dir, "disease.fp16.onnx")
            model_fp32 = onnx.load(fp32_path)
            model_fp16 = float16.convert_float_to_float16(model_fp32)
            onnx.save(model_fp16, fp16_path)
            variants["fp16"] = {"path": fp16_path, "size_bytes": os.path.getsize(fp16_path)}
            print(f"[+] FP16: {fp16_path} ({variants['fp16']['size_bytes']/1024/1024:.2f} MB) "
                  f"— NOTE: verify onnxruntime-react-native FP16 kernel support on your target "
                  f"devices before shipping; not all mobile builds include FP16 kernels.")
        except ImportError:
            print("[!] onnxconverter_common not installed — skipping FP16 (pip install onnxconverter-common)")

    # ---- Accuracy per variant ----
    print("\n[*] Evaluating accuracy of each variant on the held-out test split...")
    for name, v in variants.items():
        acc, n = _evaluate_onnx_accuracy(v["path"], args.crop, ort)
        v["test_accuracy"] = acc
        v["test_samples"] = n
        acc_str = f"{acc*100:.2f}%" if acc is not None else "N/A (no test data)"
        print(f"    {name:16s} size={v['size_bytes']/1024/1024:6.2f}MB  accuracy={acc_str}  n={n}")

    fp32_acc = variants["fp32"]["test_accuracy"]
    int8_acc = variants["quantized_int8"]["test_accuracy"]
    accuracy_drop = None
    if fp32_acc is not None and int8_acc is not None:
        accuracy_drop = fp32_acc - int8_acc
        verdict = "ACCEPTABLE" if accuracy_drop <= args.accuracy_drop_tolerance else "TOO LARGE — do not ship INT8"
        print(f"\n[*] FP32->INT8 accuracy drop: {accuracy_drop*100:.2f} points "
              f"(tolerance {args.accuracy_drop_tolerance*100:.1f} pts) -> {verdict}")
    else:
        print("\n[!] Cannot compute accuracy drop — no test data available for this crop yet.")

    # ---- Safety gate vs existing LIVE model ----
    live_onnx_path = os.path.join(LIVE_ASSETS_DIR, args.crop, "disease.onnx")
    live_eval_path = os.path.join(REPORTS_DIR, f"model_evaluation_{args.crop}_LIVE_BASELINE.json")
    recommendation = "NO_EXISTING_LIVE_MODEL_TO_COMPARE"
    live_size = os.path.getsize(live_onnx_path) if os.path.exists(live_onnx_path) else None
    live_acc = None
    if os.path.exists(live_eval_path):
        with open(live_eval_path, "r", encoding="utf-8") as f:
            live_acc = json.load(f).get("test_metrics", {}).get("accuracy")

    best_candidate = min(
        (v for v in variants.values() if v.get("test_accuracy") is not None),
        key=lambda v: v["size_bytes"],
        default=None,
    )

    if live_onnx_path and os.path.exists(live_onnx_path):
        if live_acc is None:
            recommendation = ("LIVE_MODEL_EXISTS_BUT_NO_BASELINE_METRICS — "
                               f"place its known accuracy in {live_eval_path} before comparing")
        elif best_candidate is None or best_candidate.get("test_accuracy") is None:
            recommendation = "CANNOT_COMPARE — candidate has no measured test accuracy"
        elif best_candidate["test_accuracy"] < live_acc - 1e-9:
            recommendation = (f"DO_NOT_REPLACE — candidate accuracy "
                               f"{best_candidate['test_accuracy']*100:.2f}% < live "
                               f"{live_acc*100:.2f}%. Keeping existing live model.")
        else:
            recommendation = (f"CANDIDATE_MEETS_OR_BEATS_LIVE — "
                               f"{best_candidate['test_accuracy']*100:.2f}% vs live "
                               f"{live_acc*100:.2f}%, size {best_candidate['size_bytes']/1024/1024:.2f}MB "
                               f"vs live {live_size/1024/1024:.2f}MB. Still requires a manual, human-approved "
                               f"promotion step — this script does NOT copy files into assets/models/.")

    print(f"\n[SAFETY GATE] {recommendation}")

    summary = {
        "crop": args.crop,
        "variants": {k: {kk: vv for kk, vv in v.items() if kk != "path"} | {"path": v["path"]} for k, v in variants.items()},
        "accuracy_drop_fp32_to_int8": accuracy_drop,
        "live_model_found": os.path.exists(live_onnx_path),
        "live_model_size_bytes": live_size,
        "live_model_accuracy": live_acc,
        "recommendation": recommendation,
    }
    summary_path = os.path.join(METADATA_DIR, f"{args.crop}_optimization_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"[+] Summary written: {summary_path}")


if __name__ == "__main__":
    main()
