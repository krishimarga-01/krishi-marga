# Krishi Marga — Offline ONNX Training Pipeline

**STATUS OF EVERY SCRIPT IN THIS FOLDER: READY TO RUN — NOT YET RUN.**
No training has happened. No Kaggle dataset has been downloaded. No
`.onnx` file produced by this pipeline has been copied into
`assets/models/`. This README only documents commands; it does not
claim any result.

## What this pipeline touches

- Reads (never modifies): `76_CROP_COVERAGE_MATRIX.csv`, `src/models/model_registry.json`
- Writes only under: `training_data/`, `training_output/`, `reports/`
- Never writes to: `assets/models/` (the live mobile model files), any UI/navigation/service/n8n/Gemini/Supabase/RSK/localization/camera code

Promoting a candidate model into `assets/models/<crop>/disease.onnx` is
a **manual, human-approved copy step** — no script in this folder does
it automatically. See "Promoting a candidate model" at the end.

## Verified mobile inference contract (do not change)

```
input  : [1, 3, 224, 224]  NCHW  float32  RGB
         normalized as (pixel/255 - mean) / std
         mean = [0.485, 0.456, 0.406]   std = [0.229, 0.224, 0.225]
output : softmax probabilities, one per crop's class list
```
Source of truth: `src/offline/onnxEngine.ts` (`ONNX_CONFIG`) and
`src/models/model_registry.json`. This is also hard-coded as constants
in `training/pipeline_config.py`.

## Files in this folder

| File | Purpose |
|---|---|
| `pipeline_config.py` | Shared paths + the mobile contract constants. Imported by everything else. |
| `dataset_registry.template.json` | All 76 crop_ids with an empty `kaggle_datasets` list. Copy to `dataset_registry.json` and fill in **real, verified** Kaggle dataset ids yourself — nothing here is pre-filled or invented. |
| `dataset_audit.py` | `download` / `audit` / `split` / `report` subcommands. |
| `train_crop_model.py` | Generalized (`--crop`, `--arch`) training, class-weighted for imbalance. |
| `export_and_validate_onnx.py` | Exports checkpoint → ONNX, validates shape/ops/numerical equivalence/latency. |
| `optimize_onnx.py` | Graph optimization, INT8 quantization, optional FP16, accuracy comparison, safety gate vs. the existing live model. |

---

## A. Local Windows setup

```powershell
# 1. Environment
cd krishi-marga
python -m venv .venv
.venv\Scripts\activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install onnx onnxruntime onnxruntime-tools onnxconverter-common kaggle pillow numpy

# 2. Kaggle credential setup (never hard-code these)
#    Get your key from https://www.kaggle.com/settings -> "Create New Token"
$env:KAGGLE_USERNAME = "your_kaggle_username"
$env:KAGGLE_KEY      = "your_kaggle_key"

# 3. Fill in real dataset IDs
copy training\dataset_registry.template.json training\dataset_registry.json
# edit training\dataset_registry.json by hand: for each crop you actually
# have a verified Kaggle dataset for, add:
#   {"kaggle_id": "owner/dataset-name", "license": "CC BY 4.0", "notes": "..."}

cd training

# 4. Download (one crop + dataset id at a time, explicit)
python dataset_audit.py download --crop cotton --dataset-id owner/dataset-name

# 5. Audit (corrupt/duplicate detection, class discovery)
python dataset_audit.py audit --crop cotton

# 6. Split (leakage-safe train/valid/test)
python dataset_audit.py split --crop cotton --clean

# 7. Regenerate the coverage report across all 76 crops
python dataset_audit.py report

# 8. Train
python train_crop_model.py --crop cotton --arch mobilenet_v3_small --epochs 15

# 9. Export + validate ONNX (mobile contract check + numerical equivalence)
python export_and_validate_onnx.py --crop cotton --arch mobilenet_v3_small

# 10. Optimize + quantize + safety-gate against the existing live model
python optimize_onnx.py --crop cotton --accuracy-drop-tolerance 0.02
```

## B. Google Colab

```python
# Cell 1 — environment
!pip -q install onnx onnxruntime onnxconverter-common kaggle
# torch/torchvision are preinstalled on Colab; upgrade only if needed:
# !pip -q install -U torch torchvision

# Cell 2 — Kaggle credentials (upload your kaggle.json via the file
# browser first: Kaggle account settings -> Create New Token)
import os, shutil
os.makedirs('/root/.kaggle', exist_ok=True)
shutil.move('kaggle.json', '/root/.kaggle/kaggle.json')
os.chmod('/root/.kaggle/kaggle.json', 0o600)
# dataset_audit.py reads KAGGLE_USERNAME/KAGGLE_KEY env vars OR this file;
# if you prefer env vars instead of uploading kaggle.json:
# os.environ['KAGGLE_USERNAME'] = 'your_kaggle_username'
# os.environ['KAGGLE_KEY'] = 'your_kaggle_key'

# Cell 3 — get the project (upload the zip, or mount Drive, then cd in)
!unzip -q krishi-marga.zip -d /content/krishi-marga
%cd /content/krishi-marga/training

# Cell 4 — fill in dataset_registry.json
!cp dataset_registry.template.json dataset_registry.json
# then edit it in the Colab file browser with real, verified Kaggle ids

# Cell 5 — pipeline (same subcommands as Windows)
!python dataset_audit.py download --crop cotton --dataset-id owner/dataset-name
!python dataset_audit.py audit --crop cotton
!python dataset_audit.py split --crop cotton --clean
!python dataset_audit.py report
!python train_crop_model.py --crop cotton --arch mobilenet_v3_small --epochs 15
!python export_and_validate_onnx.py --crop cotton --arch mobilenet_v3_small
!python optimize_onnx.py --crop cotton --accuracy-drop-tolerance 0.02

# Cell 6 — download results back to your machine
from google.colab import files
files.download('/content/krishi-marga/training_output/onnx_candidates/cotton/disease.int8.onnx')
files.download('/content/krishi-marga/reports/crop_coverage_report.csv')
```

Colab gives you a free GPU (`Runtime -> Change runtime type -> GPU`),
which `train_crop_model.py` will use automatically via
`torch.cuda.is_available()` — no code change needed.

---

## Mobile compatibility test (do this before ever promoting a candidate)

`export_and_validate_onnx.py` already checks the candidate's op list
against a known onnxruntime-react-native-compatible allow-list and
confirms the `[1,3,224,224]` NCHW contract. That is a **necessary but
not sufficient** check. Before promoting:

1. Copy the chosen `.onnx` file into a throwaway crop slot (e.g.
   `assets/models/_candidate_test/`) and point a dev build's
   `onnxruntime-react-native` session at it directly (outside the
   normal app flow) to confirm `InferenceSession.create()` succeeds
   on an actual Android/iOS device, not just desktop `onnxruntime`.
2. Run at least one real photo through it end-to-end and confirm the
   output tensor has the expected number of classes and sums to ~1.0.
3. Only after both pass, do the manual promotion step below.

## Promoting a candidate model (manual, human step — not automated)

```powershell
# Only after optimize_onnx.py's safety gate says CANDIDATE_MEETS_OR_BEATS_LIVE
# and the mobile compatibility test above has passed on a real device:
copy training_output\onnx_candidates\cotton\disease.int8.onnx assets\models\cotton\disease.onnx
# then update assets/models/cotton/classes.json and
# src/models/model_registry.json's "classes"/"num_classes" for cotton
# ONLY IF the class list changed. If the class list is unchanged, no
# app code needs to change at all.
```

This pipeline deliberately never performs this copy itself, per the
project's own safety rule: a new model is never substituted for an
existing working one without demonstrated, human-reviewed evidence.
