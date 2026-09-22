"""
KRISHI MARGA — DATASET DOWNLOAD, AUDIT & SPLIT PIPELINE
STATUS: READY TO RUN — nothing in this file executes on import.
Nothing downloads, trains, or writes report data until you invoke a
subcommand from the command line (see training/README.md).

Pipeline stages (each is its own subcommand so you can inspect results
before moving to the next stage):

  1. download   -- pull Kaggle dataset(s) for one crop into training_data/raw/
  2. audit      -- corrupt/duplicate detection + class-name mapping
  3. split      -- leakage-safe train/val/test split into training_data/processed/
  4. report     -- (re)generate reports/crop_coverage_report.csv for ALL 76 crops
                    from whatever is actually present in training_data/processed/

Kaggle credentials:
  Provide via environment variables (never hard-coded):
    KAGGLE_USERNAME
    KAGGLE_KEY
  or a kaggle.json in the default kaggle CLI location. See README.md.

This script never invents a Kaggle dataset id. It only downloads
dataset ids that YOU pass on the command line or that YOU have written
into training/dataset_registry.json.
"""

import argparse
import csv
import hashlib
import json
import os
import random
import shutil
import sys
import zipfile

from pipeline_config import (
    DATA_RAW_DIR, DATA_PROCESSED_DIR, REPORTS_DIR,
    MIN_IMAGES_PER_CLASS, MIN_TOTAL_IMAGES_FOR_CROP,
    TRAIN_SPLIT, VAL_SPLIT, TEST_SPLIT,
    load_crop_catalogue, load_model_registry, load_dataset_registry,
)

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".bmp")


# ---------------------------------------------------------------------------
# 1. DOWNLOAD (guarded — only runs when explicitly invoked)
# ---------------------------------------------------------------------------
def cmd_download(args):
    """Download a specific Kaggle dataset for a specific crop.
    Requires: pip install kaggle ; KAGGLE_USERNAME + KAGGLE_KEY env vars.
    """
    if not os.environ.get("KAGGLE_USERNAME") or not os.environ.get("KAGGLE_KEY"):
        print("[!] KAGGLE_USERNAME / KAGGLE_KEY not set in environment.")
        print("    This script will NOT prompt for or store credentials.")
        print("    See training/README.md, section 'Kaggle credential setup'.")
        sys.exit(1)

    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
    except ImportError:
        print("[!] The 'kaggle' package is not installed. Run: pip install kaggle")
        sys.exit(1)

    dataset_id = args.dataset_id  # e.g. "owner/dataset-name" — never invented, user-supplied
    crop_id = args.crop

    dest_dir = os.path.join(DATA_RAW_DIR, crop_id, dataset_id.replace("/", "__"))
    os.makedirs(dest_dir, exist_ok=True)

    print(f"[*] Authenticating with Kaggle API (credentials from environment only)...")
    api = KaggleApi()
    api.authenticate()

    print(f"[*] Downloading dataset '{dataset_id}' for crop '{crop_id}' -> {dest_dir}")
    api.dataset_download_files(dataset_id, path=dest_dir, unzip=True, quiet=False)
    print(f"[+] Download complete. Raw files at: {dest_dir}")
    print(f"[!] Next: record this dataset's license in training/dataset_registry.json, "
          f"then run: python dataset_audit.py audit --crop {crop_id}")


# ---------------------------------------------------------------------------
# 2. AUDIT — corrupted/duplicate detection + class name normalization
# ---------------------------------------------------------------------------
def _sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def _is_readable_image(path):
    try:
        from PIL import Image
        with Image.open(path) as im:
            im.verify()
        return True
    except Exception:
        return False


def _normalize_class_name(raw_name):
    """Loose normalization: lowercase, spaces/hyphens -> underscore.
    Does NOT invent a mapping to model_registry.json class names — that
    mapping must be confirmed by a human in dataset_registry.json before
    training, because disease-name spelling varies a lot across datasets.
    """
    return raw_name.strip().lower().replace("-", "_").replace(" ", "_")


def cmd_audit(args):
    crop_id = args.crop
    raw_dir = os.path.join(DATA_RAW_DIR, crop_id)
    if not os.path.isdir(raw_dir):
        print(f"[!] No raw data found at {raw_dir}. Run 'download' first, "
              f"or place manually downloaded images there yourself.")
        sys.exit(1)

    registry = load_model_registry()
    known_classes = set()
    if crop_id in registry:
        known_classes = {c.lower() for c in registry[crop_id].get("classes", [])}

    seen_hashes = {}
    corrupt = []
    duplicates = []
    class_counts = {}
    manifest_rows = []

    for root, _, files in os.walk(raw_dir):
        for fname in files:
            if not fname.lower().endswith(IMAGE_EXTS):
                continue
            fpath = os.path.join(root, fname)
            class_guess = _normalize_class_name(os.path.basename(root))

            if not _is_readable_image(fpath):
                corrupt.append(fpath)
                continue

            sha = _sha256_of(fpath)
            if sha in seen_hashes:
                duplicates.append((fpath, seen_hashes[sha]))
                continue
            seen_hashes[sha] = fpath

            class_counts[class_guess] = class_counts.get(class_guess, 0) + 1
            manifest_rows.append({
                "path": fpath, "class": class_guess, "sha256": sha,
                "mapped_to_registry": class_guess in known_classes,
            })

    manifest_path = os.path.join(DATA_RAW_DIR, crop_id, "dataset_manifest.csv")
    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["path", "class", "sha256", "mapped_to_registry"])
        w.writeheader()
        w.writerows(manifest_rows)

    print(f"[AUDIT] crop={crop_id}")
    print(f"  raw files scanned      : {sum(len(files) for _, _, files in os.walk(raw_dir))}")
    print(f"  corrupt/unreadable     : {len(corrupt)}")
    print(f"  exact duplicates       : {len(duplicates)}")
    print(f"  usable unique images   : {len(manifest_rows)}")
    print(f"  classes found          : {sorted(class_counts.keys())}")
    for cls, n in sorted(class_counts.items()):
        flag = "" if n >= MIN_IMAGES_PER_CLASS else "  <-- BELOW MIN_IMAGES_PER_CLASS"
        mapped = "mapped" if cls in known_classes else "UNMAPPED (check dataset_registry.json / model_registry.json)"
        print(f"    - {cls:30s} {n:6d} images   [{mapped}]{flag}")
    print(f"[+] Manifest written: {manifest_path}")
    print("[!] This step does NOT train anything and does NOT claim any crop is 'ready'.")


# ---------------------------------------------------------------------------
# 3. SPLIT — leakage-safe train/val/test split from an audited manifest
# ---------------------------------------------------------------------------
def cmd_split(args):
    crop_id = args.crop
    manifest_path = os.path.join(DATA_RAW_DIR, crop_id, "dataset_manifest.csv")
    if not os.path.exists(manifest_path):
        print(f"[!] No manifest at {manifest_path}. Run 'audit' first.")
        sys.exit(1)

    with open(manifest_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    by_class = {}
    for r in rows:
        by_class.setdefault(r["class"], []).append(r)

    out_dir = os.path.join(DATA_PROCESSED_DIR, crop_id)
    if os.path.exists(out_dir) and args.clean:
        shutil.rmtree(out_dir)

    rng = random.Random(42)  # deterministic split
    split_report = {}

    for cls, items in by_class.items():
        rng.shuffle(items)
        n = len(items)
        if n < MIN_IMAGES_PER_CLASS:
            print(f"[!] Skipping class '{cls}' ({n} images) — below MIN_IMAGES_PER_CLASS={MIN_IMAGES_PER_CLASS}")
            continue
        n_train = int(n * TRAIN_SPLIT)
        n_val = int(n * VAL_SPLIT)
        splits = {
            "train": items[:n_train],
            "valid": items[n_train:n_train + n_val],
            "test": items[n_train + n_val:],
        }
        for split_name, split_items in splits.items():
            dest = os.path.join(out_dir, split_name, cls)
            os.makedirs(dest, exist_ok=True)
            for item in split_items:
                src = item["path"]
                shutil.copy2(src, os.path.join(dest, os.path.basename(src)))
        split_report[cls] = {k: len(v) for k, v in splits.items()}

    print(f"[SPLIT] crop={crop_id} -> {out_dir}")
    for cls, counts in split_report.items():
        print(f"  {cls:30s} train={counts['train']:5d}  valid={counts['valid']:5d}  test={counts['test']:5d}")
    if not split_report:
        print("[!] No class met the minimum image threshold — nothing was split. "
              "This crop remains NO_VERIFIED_DATA / PARTIAL.")


# ---------------------------------------------------------------------------
# 4. REPORT — crop_coverage_report.csv across ALL 76 crops
# ---------------------------------------------------------------------------
def _count_images(dir_path):
    if not os.path.isdir(dir_path):
        return 0
    total = 0
    for _, _, files in os.walk(dir_path):
        total += sum(1 for f in files if f.lower().endswith(IMAGE_EXTS))
    return total


def cmd_report(args):
    catalogue = load_crop_catalogue()
    dataset_registry = load_dataset_registry()

    out_path = os.path.join(REPORTS_DIR, "crop_coverage_report.csv")
    fieldnames = [
        "crop", "dataset", "raw_images", "usable_images",
        "disease_classes", "healthy_classes",
        "train_images", "validation_images", "test_images",
        "license", "status",
    ]

    rows_out = []
    for row in catalogue:
        crop_id = row["crop_id"]
        processed_dir = os.path.join(DATA_PROCESSED_DIR, crop_id)
        raw_dir = os.path.join(DATA_RAW_DIR, crop_id)

        train_n = _count_images(os.path.join(processed_dir, "train"))
        valid_n = _count_images(os.path.join(processed_dir, "valid"))
        test_n = _count_images(os.path.join(processed_dir, "test"))
        usable_n = train_n + valid_n + test_n
        raw_n = _count_images(raw_dir)

        classes = []
        train_dir = os.path.join(processed_dir, "train")
        if os.path.isdir(train_dir):
            classes = [d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))]
        healthy_classes = [c for c in classes if "healthy" in c.lower() or "fresh" in c.lower()]
        disease_classes = [c for c in classes if c not in healthy_classes]

        entry = dataset_registry.get(crop_id, {})
        dataset_names = ", ".join(d.get("kaggle_id", "") for d in entry.get("kaggle_datasets", [])) or "NONE_CONFIGURED"
        licenses = ", ".join(d.get("license", "") for d in entry.get("kaggle_datasets", [])) or "N/A"

        if usable_n == 0:
            status = "NO_VERIFIED_DATA"
        elif usable_n < MIN_TOTAL_IMAGES_FOR_CROP or len(disease_classes) == 0:
            status = "PARTIAL"
        else:
            status = "PARTIAL" if len(healthy_classes) == 0 else "FULL"
            # "FULL" here means: this crop has a real, split, class-balanced
            # dataset ready for training — NOT that a model has been trained
            # or that all known diseases for the crop are covered.

        rows_out.append({
            "crop": crop_id,
            "dataset": dataset_names,
            "raw_images": raw_n,
            "usable_images": usable_n,
            "disease_classes": len(disease_classes),
            "healthy_classes": len(healthy_classes),
            "train_images": train_n,
            "validation_images": valid_n,
            "test_images": test_n,
            "license": licenses,
            "status": status,
        })

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows_out)

    full_n = sum(1 for r in rows_out if r["status"] == "FULL")
    partial_n = sum(1 for r in rows_out if r["status"] == "PARTIAL")
    none_n = sum(1 for r in rows_out if r["status"] == "NO_VERIFIED_DATA")
    print(f"[REPORT] {out_path}")
    print(f"  crops total          : {len(rows_out)}")
    print(f"  FULL                 : {full_n}")
    print(f"  PARTIAL              : {partial_n}")
    print(f"  NO_VERIFIED_DATA     : {none_n}")


def main():
    parser = argparse.ArgumentParser(description="Krishi Marga dataset download/audit/split/report pipeline")
    sub = parser.add_subparsers(dest="command", required=True)

    p_dl = sub.add_parser("download", help="Download a Kaggle dataset for one crop (explicit, never automatic)")
    p_dl.add_argument("--crop", required=True, help="crop_id from 76_CROP_COVERAGE_MATRIX.csv")
    p_dl.add_argument("--dataset-id", required=True, help="Kaggle dataset id, e.g. owner/dataset-name")
    p_dl.set_defaults(func=cmd_download)

    p_audit = sub.add_parser("audit", help="Corrupt/duplicate detection + class discovery for one crop")
    p_audit.add_argument("--crop", required=True)
    p_audit.set_defaults(func=cmd_audit)

    p_split = sub.add_parser("split", help="Leakage-safe train/val/test split for one crop")
    p_split.add_argument("--crop", required=True)
    p_split.add_argument("--clean", action="store_true", help="Wipe any existing processed split first")
    p_split.set_defaults(func=cmd_split)

    p_report = sub.add_parser("report", help="(Re)generate reports/crop_coverage_report.csv for all 76 crops")
    p_report.set_defaults(func=cmd_report)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
