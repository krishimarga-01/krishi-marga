# KRISHI MARGA — COTTON MODEL EVALUATION & ONNX VALIDATION REPORT
Date: 2026-09-11
Auditor: Automated PyTorch & ONNX Runtime Empirical Benchmarker
Status: **MODEL STATUS: 🟢 TRAINED, EVALUATED & ONNX EXPORTED**

---

## 1. Executive Summary

A deep convolutional neural network (**MobileNetV3-Small**) was trained from real agricultural leaf photography for **Cotton** disease diagnosis.
The trained model was evaluated against an out-of-sample test partition (strictly filtered against train/val data leakage), exported to ONNX format with baked-in Softmax probability activation, and validated using the official ONNX Runtime.

- **Target Crop**: Cotton
- **Number of Classes**: 4 (`bacterial_blight`, `curl_virus`, `fussarium_wilt`, `healthy`)
- **Architecture**: MobileNetV3-Small (Feature extractor + classifier head)
- **Input Dimension**: `[1, 3, 224, 224]` (Float32, ImageNet normalization)
- **Test Set Accuracy**: **98.04%**
- **Macro F1-Score**: **0.9803**
- **ONNX Model Size**: **5.82 MB** (6,098,519 bytes)
- **ONNX Inference Latency**: **2.51 ms** per image (CPU execution)
- **Mathematical Equivalence**: **PASS** (PyTorch vs ONNX max diff: `0.00000048`)

---

## 2. Test Set Performance Breakdown

| Metric | Empirical Value |
|---|---|
| **Top-1 Accuracy** | **98.04%** |
| **Macro Precision** | 0.9813 |
| **Macro Recall** | 0.9794 |
| **Macro F1-Score** | **0.9803** |

### Per-Class Performance
| Class Name | Precision | Recall | F1-Score | Test Samples |
|---|---|---|---|---|
| bacterial_blight | 0.9773 | 1.0000 | 0.9885 | 43 |
| curl_virus | 1.0000 | 0.9697 | 0.9846 | 33 |
| fussarium_wilt | 0.9737 | 0.9737 | 0.9737 | 38 |
| healthy | 0.9744 | 0.9744 | 0.9744 | 39 |

---

## 3. Confusion Matrix

| True \ Pred | bacterial_blight | curl_virus | fussarium_wilt | healthy |
|---|---|---|---|---|
| **bacterial_blight** | 43 | 0 | 0 | 0 |
| **curl_virus** | 1 | 32 | 0 | 0 |
| **fussarium_wilt** | 0 | 0 | 37 | 1 |
| **healthy** | 0 | 0 | 1 | 38 |

---

## 4. ONNX Runtime Mobile Validation

- **ONNX File**: `models/onnx/cotton_disease.onnx`
- **Checker Status**: Structural validity verified via `onnx.checker.check_model`
- **Output Validation**: Softmax normalization verified ($\sum P_i = 1.0000$)
- **NaN / Inf Check**: None detected (`has_nan_or_inf: false`)
- **Latency Benchmark (50 iterations)**:
  - Mean: **2.51 ms**
  - 95th Percentile: 3.60 ms
  - 99th Percentile: 4.24 ms

---
**MODEL STATUS: 🟢 TRAINED, EVALUATED & ONNX EXPORTED**
