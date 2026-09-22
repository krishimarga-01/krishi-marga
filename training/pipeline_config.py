"""
KRISHI MARGA — TRAINING PIPELINE SHARED CONFIG
STATUS: READY TO RUN (imported by other scripts; does not train or download anything itself)

This module is the single source of truth for:
  - the mobile ONNX inference contract (must never silently drift from
    src/offline/onnxEngine.ts / src/models/model_registry.json)
  - filesystem layout used by the pipeline
  - the master 76-crop catalogue (read from the project's own
    76_CROP_COVERAGE_MATRIX.csv, never re-typed by hand)

Nothing in this file touches the existing app. It only *reads*
76_CROP_COVERAGE_MATRIX.csv and src/models/model_registry.json.
"""

import csv
import json
import os

# ---------------------------------------------------------------------------
# Paths (relative to project root; run all scripts from the project root)
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

CROP_MATRIX_CSV = os.path.join(PROJECT_ROOT, "76_CROP_COVERAGE_MATRIX.csv")
MODEL_REGISTRY_JSON = os.path.join(PROJECT_ROOT, "src", "models", "model_registry.json")

DATASET_REGISTRY_JSON = os.path.join(os.path.dirname(__file__), "dataset_registry.json")

DATA_RAW_DIR = os.path.join(PROJECT_ROOT, "training_data", "raw")
DATA_PROCESSED_DIR = os.path.join(PROJECT_ROOT, "training_data", "processed")

CHECKPOINT_DIR = os.path.join(PROJECT_ROOT, "training_output", "checkpoints")
ONNX_CANDIDATE_DIR = os.path.join(PROJECT_ROOT, "training_output", "onnx_candidates")
METADATA_DIR = os.path.join(PROJECT_ROOT, "training_output", "metadata")
REPORTS_DIR = os.path.join(PROJECT_ROOT, "reports")

# The LIVE, mobile-facing model assets. The pipeline NEVER writes here
# automatically. Promotion is a manual, explicit, human-approved step
# (see training/README.md, "Promoting a candidate model").
LIVE_ASSETS_DIR = os.path.join(PROJECT_ROOT, "assets", "models")

for _d in (DATA_RAW_DIR, DATA_PROCESSED_DIR, CHECKPOINT_DIR, ONNX_CANDIDATE_DIR,
           METADATA_DIR, REPORTS_DIR):
    os.makedirs(_d, exist_ok=True)

# ---------------------------------------------------------------------------
# VERIFIED MOBILE ONNX INFERENCE CONTRACT
# Source of truth: src/offline/onnxEngine.ts (ONNX_CONFIG) and
# src/models/model_registry.json. Do NOT change these values unless the
# mobile app's contract itself changes — that is out of scope for this
# training pipeline.
# ---------------------------------------------------------------------------
INPUT_SHAPE = (1, 3, 224, 224)     # NCHW
INPUT_LAYOUT = "NCHW"
INPUT_DTYPE = "float32"
COLOR_SPACE = "RGB"
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)
ONNX_OPSET = 14

# Matches the naming already used by the project's existing
# training/train_crop_model.py + training/export_and_validate_onnx.py,
# which produced the ONNX files currently listed in model_registry.json.
ONNX_INPUT_NAME = "input_image"
ONNX_OUTPUT_NAME = "probabilities"

# Operators known to be supported by onnxruntime-react-native for this
# class of mobile CNN graph. Used by export_and_validate_onnx.py as an
# allow-list sanity check, not an exhaustive compatibility guarantee —
# always also run the mobile compatibility smoke test in the README.
RN_SUPPORTED_OP_ALLOWLIST = {
    "Conv", "Relu", "Clip", "Add", "Mul", "Div", "Sub", "Constant",
    "GlobalAveragePool", "AveragePool", "MaxPool", "Reshape", "Flatten",
    "Gemm", "MatMul", "Softmax", "Sigmoid", "HardSigmoid", "HardSwish",
    "BatchNormalization", "Concat", "Transpose", "Shape", "Gather",
    "Unsqueeze", "Squeeze", "Cast", "Resize", "Pad", "ReduceMean",
    "QuantizeLinear", "DequantizeLinear", "QLinearConv", "QLinearMatMul",
    "DynamicQuantizeLinear", "ConvInteger",
}

# Lightweight architectures considered "mobile-suitable" for this project.
# train_crop_model.py defaults to mobilenet_v3_small (matches the existing
# app's already-shipped models), others are opt-in via --arch.
SUPPORTED_ARCHITECTURES = (
    "mobilenet_v3_small",
    "mobilenet_v3_large",
    "efficientnet_lite0_proxy",  # implemented via torchvision efficientnet_b0 fallback, see train_crop_model.py
)

MIN_IMAGES_PER_CLASS = 40   # below this a class is flagged INSUFFICIENT rather than trained on
MIN_TOTAL_IMAGES_FOR_CROP = 150  # below this the crop as a whole is NO_VERIFIED_DATA / PARTIAL

TRAIN_SPLIT = 0.70
VAL_SPLIT = 0.15
TEST_SPLIT = 0.15


def load_crop_catalogue():
    """Read the master 76-crop catalogue. Source of truth only — never
    invents or drops crops. Returns a list of dicts."""
    if not os.path.exists(CROP_MATRIX_CSV):
        raise FileNotFoundError(
            f"Master crop catalogue not found at {CROP_MATRIX_CSV}. "
            "This pipeline refuses to guess a crop list."
        )
    with open(CROP_MATRIX_CSV, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    return rows


def load_model_registry():
    """Read the existing verified model_registry.json (read-only)."""
    if not os.path.exists(MODEL_REGISTRY_JSON):
        return {}
    with open(MODEL_REGISTRY_JSON, "r", encoding="utf-8-sig") as f:
        return json.load(f)


def load_dataset_registry():
    """Read training/dataset_registry.json — the user-maintained mapping
    of crop_id -> Kaggle dataset identifiers. Never auto-populated with
    invented dataset IDs. Returns {} if the user has not filled it in yet."""
    if not os.path.exists(DATASET_REGISTRY_JSON):
        return {}
    with open(DATASET_REGISTRY_JSON, "r", encoding="utf-8") as f:
        return json.load(f)
