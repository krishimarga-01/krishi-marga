"""
Krishi Marga — Dataset Preparation & Stratified Split
Cleans images, filters corrupt files, normalizes orientation/format to RGB,
and creates clean train/validation/test splits.
"""

import os
import sys
import shutil
import json
import random
import argparse
from pathlib import Path
from PIL import Image

VALID_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}

def prepare_dataset(raw_dataset_path, output_dir=None, crop_filter=None,
                    train_ratio=0.8, val_ratio=0.1, test_ratio=0.1, seed=42):
    random.seed(seed)
    raw_path = Path(raw_dataset_path).resolve()
    if not raw_path.exists():
        print(f"[ERROR] Path does not exist: {raw_path}")
        sys.exit(1)

    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "dataset" / "processed"
    else:
        output_dir = Path(output_dir).resolve()

    print("=" * 65)
    print("      KRISHI MARGA — DATASET PREPARATION & SPLIT BUILDER     ")
    print("=" * 65)
    print(f"Source Dataset: {raw_path}")
    print(f"Target Output : {output_dir}")
    print(f"Split Ratios  : Train {int(train_ratio*100)}% | Val {int(val_ratio*100)}% | Test {int(test_ratio*100)}%")
    if crop_filter:
        print(f"Crop Filter   : {crop_filter}")
    print("-" * 65)

    # 1. Discover all class directories
    class_images = {}
    for p in raw_path.rglob('*'):
        if p.is_file() and p.suffix.lower() in VALID_EXTS:
            class_name = p.parent.name
            if class_name.lower() in ['images', 'train', 'val', 'test', 'valid']:
                class_name = p.parent.parent.name

            if crop_filter:
                if crop_filter.lower() not in class_name.lower():
                    continue

            if class_name not in class_images:
                class_images[class_name] = []
            class_images[class_name].append(p)

    if not class_images:
        print("[ERROR] No valid images found matching criteria.")
        sys.exit(1)

    print(f"[DISCOVERY] Found {len(class_images)} classes across {sum(len(v) for v in class_images.values())} images.")

    # Create target split directories
    for split in ['train', 'val', 'test']:
        for cls in class_images.keys():
            (output_dir / split / cls).mkdir(parents=True, exist_ok=True)

    class_names_map = {}
    stats = {"train": 0, "val": 0, "test": 0, "corrupt_skipped": 0}

    for idx, (cls, img_list) in enumerate(sorted(class_images.items())):
        class_names_map[str(idx)] = cls
        random.shuffle(img_list)

        n_total = len(img_list)
        n_train = int(n_total * train_ratio)
        n_val = int(n_total * val_ratio)

        splits = {
            'train': img_list[:n_train],
            'val': img_list[n_train:n_train + n_val],
            'test': img_list[n_train + n_val:]
        }

        print(f"  -> Processing [{cls}]: Total={n_total} (Train={len(splits['train'])}, Val={len(splits['val'])}, Test={len(splits['test'])})")

        for split_name, files in splits.items():
            for src_file in files:
                dest_file = output_dir / split_name / cls / src_file.name
                try:
                    # Safe verification & conversion to RGB JPEG
                    with Image.open(src_file) as im:
                        rgb_im = im.convert('RGB')
                        rgb_im.save(dest_file, format='JPEG', quality=95)
                    stats[split_name] += 1
                except Exception as e:
                    stats["corrupt_skipped"] += 1

    # Save class_names.json for ONNX mapping
    outputs_dir = Path(__file__).parent.parent / "outputs"
    outputs_dir.mkdir(parents=True, exist_ok=True)

    class_map_file = outputs_dir / "class_names.json"
    with open(class_map_file, "w", encoding="utf-8") as f:
        json.dump(class_names_map, f, indent=2)

    summary = {
        "source_dataset": str(raw_path),
        "num_classes": len(class_names_map),
        "classes": list(class_names_map.values()),
        "splits": stats,
        "seed": seed
    }
    with open(outputs_dir / "split_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("-" * 65)
    print(f"Preparation Complete!")
    print(f"  Train Images : {stats['train']:,}")
    print(f"  Val Images   : {stats['val']:,}")
    print(f"  Test Images  : {stats['test']:,}")
    print(f"  Skipped      : {stats['corrupt_skipped']}")
    print(f"Class mapping saved to: {class_map_file}")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare dataset and create clean splits")
    parser.add_argument("--dataset", type=str, required=True, help="Path to raw dataset")
    parser.add_argument("--output", type=str, default=None, help="Target processed directory")
    parser.add_argument("--crop", type=str, default=None, help="Optional crop filter (e.g. Tomato, Rice)")
    parser.add_argument("--train-ratio", type=float, default=0.8)
    parser.add_argument("--val-ratio", type=float, default=0.1)
    parser.add_argument("--test-ratio", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    prepare_dataset(
        args.dataset,
        output_dir=args.output,
        crop_filter=args.crop,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio,
        test_ratio=args.test_ratio,
        seed=args.seed
    )
