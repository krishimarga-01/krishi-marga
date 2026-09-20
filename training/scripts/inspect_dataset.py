"""
Krishi Marga — Dataset Inspection Utility
Scans any local directory, auto-detects folder hierarchy, checks image health,
and reports class balance.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from collections import defaultdict
from PIL import Image

VALID_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}

def parse_class_name(folder_name):
    """
    Parses class folders into (crop, disease).
    Supports:
    - PlantVillage: 'Tomato___Early_blight' -> ('Tomato', 'Early Blight')
    - Hyphen: 'Tomato - Early Blight' -> ('Tomato', 'Early Blight')
    - Simple: 'Early Blight' -> ('Unknown', 'Early Blight')
    """
    cleaned = folder_name.strip()
    if '___' in cleaned:
        parts = cleaned.split('___')
        crop = parts[0].replace('_', ' ').strip()
        disease = parts[1].replace('_', ' ').strip()
        return crop, disease
    elif ' - ' in cleaned:
        parts = cleaned.split(' - ')
        return parts[0].strip(), parts[1].strip()
    elif '__' in cleaned:
        parts = cleaned.split('__')
        crop = parts[0].replace('_', ' ').strip()
        disease = parts[1].replace('_', ' ').strip()
        return crop, disease
    return "General", cleaned.replace('_', ' ').strip()

def inspect_dataset(dataset_path, output_json=None):
    dataset_path = Path(dataset_path).resolve()
    if not dataset_path.exists():
        print(f"\n[ERROR] Dataset path does not exist: {dataset_path}")
        sys.exit(1)

    print("=" * 65)
    print("      KRISHI MARGA — DATASET INSPECTION & AUDIT REPORT       ")
    print("=" * 65)
    print(f"Scanning directory: {dataset_path}\n")

    # Detect if dataset contains train/val/test splits
    subdirs = [d.name.lower() for d in dataset_path.iterdir() if d.is_dir()]
    has_splits = any(s in subdirs for s in ['train', 'val', 'valid', 'test'])

    scan_roots = []
    if has_splits:
        print("[STRUCTURE] Detected pre-split directory structure (train/val/test).")
        for s in ['train', 'val', 'valid', 'test']:
            sp = dataset_path / s
            if sp.exists():
                scan_roots.append((s, sp))
    else:
        scan_roots.append(('all', dataset_path))

    class_images = defaultdict(list)
    corrupted_files = []
    crop_classes = defaultdict(set)
    extension_counts = defaultdict(int)

    total_scanned = 0
    print("[PROGRESS] Scanning files and validating image integrity...")

    for split_label, root_dir in scan_roots:
        for p in root_dir.rglob('*'):
            if p.is_file():
                ext = p.suffix.lower()
                extension_counts[ext] += 1
                if ext in VALID_EXTENSIONS:
                    total_scanned += 1
                    # Determine class from parent folder
                    class_folder = p.parent.name
                    if class_folder.lower() in ['images', 'train', 'val', 'test', 'valid']:
                        # Check grandparent
                        class_folder = p.parent.parent.name

                    crop, disease = parse_class_name(class_folder)
                    crop_classes[crop].add(disease)
                    class_images[class_folder].append(str(p))

                    # Quick corrupt check on a sample of images (first 100 or every 10th)
                    if len(class_images[class_folder]) % 25 == 0:
                        try:
                            with Image.open(p) as img:
                                img.verify()
                        except Exception as e:
                            corrupted_files.append((str(p), str(e)))

    total_valid_images = sum(len(imgs) for imgs in class_images.values())
    total_classes = len(class_images)

    print("\n" + "-" * 65)
    print(f"  Total Valid Images Found : {total_valid_images:,}")
    print(f"  Total Classes Found      : {total_classes}")
    print(f"  Detected Crops           : {len(crop_classes)}")
    print(f"  Corrupted/Unreadable     : {len(corrupted_files)}")
    print("-" * 65)

    print("\n[CROPS & CONDITIONS INVENTORY]:")
    for crop, diseases in sorted(crop_classes.items()):
        print(f"  \u2022 Crop: {crop} ({len(diseases)} disease/health condition(s))")
        for d in sorted(diseases):
            # Count images for this condition
            count = sum(len(imgs) for c_name, imgs in class_images.items() if d.lower() in c_name.lower())
            print(f"     - {d}: {count:,} images")

    if corrupted_files:
        print(f"\n[WARNING] Found {len(corrupted_files)} corrupted images (will be excluded during preparation):")
        for cf, err in corrupted_files[:5]:
            print(f"   {cf} -> {err}")

    # Save inspection report
    report = {
        "dataset_path": str(dataset_path),
        "total_images": total_valid_images,
        "total_classes": total_classes,
        "has_splits": has_splits,
        "crops": {crop: list(diseases) for crop, diseases in crop_classes.items()},
        "corrupted_count": len(corrupted_files),
        "extensions": dict(extension_counts)
    }

    out_file = output_json or (Path(__file__).parent.parent / "outputs" / "inspection_report.json")
    out_file = Path(out_file)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"\n[SAVED] Inspection report saved to: {out_file}")
    print("=" * 65 + "\n")
    return report

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Inspect plant disease dataset")
    parser.add_argument("--dataset", type=str, required=True, help="Path to raw dataset folder")
    parser.add_argument("--output", type=str, default=None, help="Path to save inspection JSON report")
    args = parser.parse_args()
    inspect_dataset(args.dataset, args.output)
