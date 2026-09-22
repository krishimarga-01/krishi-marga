import os
import hashlib
import json
import random
import shutil
from PIL import Image

RAW_DIR = r"D:\krishi_marga_data\raw\pumpkin\Pumpkin Leaf Diseases Dataset From Bangladesh\Original Dataset"
OUT_DIR = r"D:\krishi_marga_data\processed\pumpkin"

CLASS_MAPPING = {
    "Bacterial Leaf Spot": "bacterial_leaf_spot",
    "Downy Mildew": "downy_mildew",
    "Healthy Leaf": "healthy",
    "Mosaic Disease": "mosaic_disease",
    "Powdery_Mildew": "powdery_mildew"
}

os.makedirs(OUT_DIR, exist_ok=True)
for split in ['train', 'val', 'test']:
    for cls in CLASS_MAPPING.values():
        os.makedirs(os.path.join(OUT_DIR, split, cls), exist_ok=True)

stats = {
    "dataset_id": "tahmidmir/pumpkin-leaf-diseases-dataset-from-bangladesh",
    "license": "CC BY 4.0",
    "crop": "pumpkin",
    "raw_images": 0,
    "corrupted_images": 0,
    "duplicate_images": 0,
    "usable_images": 0,
    "disease_classes": 4,
    "healthy_classes": 1,
    "classes": list(CLASS_MAPPING.values()),
    "splits": {"train": 0, "val": 0, "test": 0},
    "per_class_counts": {}
}

seen_hashes = {}
valid_images = {cls: [] for cls in CLASS_MAPPING.values()}

for raw_cls, norm_cls in CLASS_MAPPING.items():
    cls_folder = os.path.join(RAW_DIR, raw_cls)
    if not os.path.exists(cls_folder):
        print(f"[!] Warning: missing {cls_folder}")
        continue
    
    files = [f for f in os.listdir(cls_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    stats["raw_images"] += len(files)
    
    for fname in files:
        fpath = os.path.join(cls_folder, fname)
        # 1. Corrupt check
        try:
            with Image.open(fpath) as img:
                img.verify()
            with Image.open(fpath) as img:
                img.convert('RGB')
        except Exception:
            stats["corrupted_images"] += 1
            continue
            
        # 2. Duplicate check via SHA-256
        h = hashlib.sha256()
        with open(fpath, 'rb') as fp:
            while chunk := fp.read(65536):
                h.update(chunk)
        digest = h.hexdigest()
        
        if digest in seen_hashes:
            stats["duplicate_images"] += 1
            continue
            
        seen_hashes[digest] = fpath
        valid_images[norm_cls].append((fpath, fname, digest))

# 3. Leakage-safe train/val/test split
random.seed(42)
for norm_cls, img_list in valid_images.items():
    stats["usable_images"] += len(img_list)
    stats["per_class_counts"][norm_cls] = len(img_list)
    
    random.shuffle(img_list)
    n = len(img_list)
    n_train = int(n * 0.70)
    n_val = int(n * 0.15)
    
    splits_data = {
        'train': img_list[:n_train],
        'val': img_list[n_train:n_train + n_val],
        'test': img_list[n_train + n_val:]
    }
    
    for split_name, split_files in splits_data.items():
        stats["splits"][split_name] += len(split_files)
        target_sub = os.path.join(OUT_DIR, split_name, norm_cls)
        for src, fn, _ in split_files:
            dst = os.path.join(target_sub, fn)
            shutil.copy2(src, dst)

os.makedirs('reports', exist_ok=True)
with open('reports/pumpkin_audit_report.json', 'w', encoding='utf-8') as f:
    json.dump(stats, f, indent=2)

print("=== PUMPKIN DATASET AUDIT COMPLETE ===")
print(json.dumps(stats, indent=2))
