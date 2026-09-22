# KRISHI MARGA — ONNX TRAINING PIPELINE READINESS AUDIT

**Date**: 2026-09-19
**Scope**: Training-pipeline preparation only. No dataset was downloaded, no model was trained, no ONNX file was produced or promoted in this session.

---

## 1. Status

| Stage | Status |
|---|---|
| Kaggle dataset download | **NOT RUN** — `dataset_audit.py download` refuses to run without `KAGGLE_USERNAME`/`KAGGLE_KEY` (verified: exits 1 with no credentials set) |
| Dataset audit (corrupt/duplicate/class mapping) | **NOT RUN** — no raw data present (verified: `audit` exits 1 when `training_data/raw/<crop>` is empty) |
| Train/val/test split | **NOT RUN** — depends on audit output |
| Model training | **NOT RUN** — no environment in this session has `torch`/`torchvision`, no GPU, and there is no dataset to train on |
| ONNX export | **NOT RUN** |
| ONNX optimization / quantization | **NOT RUN** |
| Mobile compatibility test | **NOT RUN** — requires a physical device / dev build |

## 2. What was actually verified in this session

- All 5 new/updated scripts (`pipeline_config.py`, `dataset_audit.py`, `train_crop_model.py`, `export_and_validate_onnx.py`, `optimize_onnx.py`) pass `python3 -m py_compile` (syntax-valid).
- `dataset_audit.py report` was executed for real against the live project's `76_CROP_COVERAGE_MATRIX.csv` and produced `reports/crop_coverage_report.csv`: **all 76 crops correctly report `NO_VERIFIED_DATA`**, because no dataset has been downloaded — this is the true current state, not a placeholder.
- The `download` and `audit` safety guards were exercised directly and behave as designed: they refuse to proceed rather than fabricate output.
- The `audit`/`split`/`report` mechanics (corrupt/duplicate detection, class discovery, leakage-safe hash-based split, coverage aggregation) were dry-run against a small set of **synthetic, non-agricultural placeholder images** (solid-color squares, not real crop photos) purely to confirm the code paths execute correctly end-to-end. That synthetic fixture and its output were deleted afterward and are not part of any deliverable — it does not represent, and must never be cited as, real crop data or a real dataset audit.

## 3. Crop coverage (`reports/crop_coverage_report.csv`)

- 76 / 76 crops: `NO_VERIFIED_DATA`
- 0 crops: `PARTIAL`
- 0 crops: `FULL`

This will only change when real Kaggle datasets are downloaded via `dataset_audit.py download` (with your own credentials and dataset IDs) and pushed through `audit` → `split` → `report`.

## 4. Files changed / added (training-pipeline preparation only)

**Added:**
- `training/pipeline_config.py`
- `training/dataset_registry.template.json`
- `training/README.md` (replaces prior contents — same filename)
- `reports/crop_coverage_report.csv`
- `reports/training_audit.md` (this file)

**Rewritten (generalized from the existing single-crop, Windows-hard-coded versions; same filenames, same purpose, same mobile contract):**
- `training/dataset_audit.py`
- `training/train_crop_model.py`
- `training/export_and_validate_onnx.py`

**Added (new capability, not present before):**
- `training/optimize_onnx.py`

**Untouched:** every UI, navigation, voice/TTS, camera, pesticide, n8n, Gemini, Supabase, RSK, localization file, and the existing live model assets in `assets/models/`. `src/models/model_registry.json` and `src/offline/onnxEngine.ts` were read for their contract values only — not modified.

## 5. Known limitations / what still blocks real training

- No Kaggle dataset IDs are configured anywhere (`dataset_registry.template.json` ships empty on purpose — no invented IDs).
- No GPU or ML libraries (torch/onnx/onnxruntime) are installed in this chat's sandbox, and this sandbox cannot reach `kaggle.com` (network-restricted). Real training must happen on your own Windows machine or in Google Colab, per `training/README.md`.
- Until a crop's data passes `MIN_IMAGES_PER_CLASS` / `MIN_TOTAL_IMAGES_FOR_CROP` thresholds in `pipeline_config.py`, `dataset_audit.py split` will skip that class/crop rather than train on too little data.
