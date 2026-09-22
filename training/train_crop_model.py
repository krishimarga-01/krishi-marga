"""
KRISHI MARGA — GENERALIZED CROP DISEASE MODEL TRAINING
STATUS: READY TO RUN — nothing executes on import. Requires:
  - training_data/processed/<crop>/{train,valid,test}/<class>/*.jpg
    (produced by dataset_audit.py split)
  - pip install torch torchvision onnx onnxruntime pillow numpy

This generalizes the project's existing single-crop, hard-coded
training/train_crop_model.py (previously Windows-path + Cotton-only)
into a --crop argument-driven script usable for any of the 76 crops,
while preserving the exact same verified mobile contract:

    input  : [1, 3, 224, 224], NCHW, float32, RGB, ImageNet mean/std
    output : softmax probabilities over the crop's class list

It does NOT touch models/checkpoints or model_registry.json belonging
to the live app; all outputs go to training_output/.
"""

import argparse
import json
import os
import time

import numpy as np

from pipeline_config import (
    DATA_PROCESSED_DIR, CHECKPOINT_DIR, METADATA_DIR, REPORTS_DIR,
    IMAGENET_MEAN, IMAGENET_STD, SUPPORTED_ARCHITECTURES,
    MIN_IMAGES_PER_CLASS,
)


def _lazy_imports():
    """Import heavy deps only when actually training, so this file can be
    syntax-checked / imported for its constants without torch installed."""
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader
    from torchvision import transforms, models, datasets
    return torch, nn, DataLoader, transforms, models, datasets


def build_model(arch, num_classes, torch, nn, models):
    if arch == "mobilenet_v3_small":
        m = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        in_features = m.classifier[3].in_features
        m.classifier[3] = nn.Linear(in_features, num_classes)
        return m
    if arch == "mobilenet_v3_large":
        m = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.DEFAULT)
        in_features = m.classifier[3].in_features
        m.classifier[3] = nn.Linear(in_features, num_classes)
        return m
    if arch == "efficientnet_lite0_proxy":
        # torchvision ships no true EfficientNet-Lite; efficientnet_b0 is the
        # closest small/mobile-friendly proxy available without extra deps.
        m = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
        in_features = m.classifier[1].in_features
        m.classifier[1] = nn.Linear(in_features, num_classes)
        return m
    raise ValueError(f"Unsupported architecture: {arch}. Choose from {SUPPORTED_ARCHITECTURES}")


def compute_class_weights(dataset, num_classes, torch):
    """Inverse-frequency class weighting so high-image-count classes
    (e.g. thousands of tomato images) don't drown out low-count classes."""
    counts = np.zeros(num_classes, dtype=np.float64)
    for _, label in dataset.samples:
        counts[label] += 1
    counts = np.maximum(counts, 1.0)
    weights = counts.sum() / (num_classes * counts)
    return torch.tensor(weights, dtype=torch.float32)


def main():
    parser = argparse.ArgumentParser(description="Train a per-crop disease classifier")
    parser.add_argument("--crop", required=True, help="crop_id, must match training_data/processed/<crop>")
    parser.add_argument("--arch", default="mobilenet_v3_small", choices=SUPPORTED_ARCHITECTURES)
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--data-dir", default=None, help="Override training_data/processed/<crop>")
    args = parser.parse_args()

    torch, nn, DataLoader, transforms, models, datasets = _lazy_imports()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=================================================================")
    print(f"   KRISHI MARGA — {args.crop.upper()} DISEASE CLASSIFIER TRAINING")
    print("=================================================================")
    print(f"[*] Device: {device} | Architecture: {args.arch}")

    data_dir = args.data_dir or os.path.join(DATA_PROCESSED_DIR, args.crop)
    train_dir = os.path.join(data_dir, "train")
    valid_dir = os.path.join(data_dir, "valid")
    test_dir = os.path.join(data_dir, "test")
    for d in (train_dir, valid_dir, test_dir):
        if not os.path.isdir(d):
            raise FileNotFoundError(
                f"{d} not found. Run: python dataset_audit.py split --crop {args.crop}"
            )

    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=list(IMAGENET_MEAN), std=list(IMAGENET_STD)),
    ])
    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=list(IMAGENET_MEAN), std=list(IMAGENET_STD)),
    ])

    train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
    valid_dataset = datasets.ImageFolder(valid_dir, transform=eval_transform)
    test_dataset = datasets.ImageFolder(test_dir, transform=eval_transform)

    classes = train_dataset.classes
    num_classes = len(classes)
    print(f"[*] Classes ({num_classes}): {classes}")
    print(f"[*] Dataset sizes -> Train: {len(train_dataset)}, Valid: {len(valid_dataset)}, Test: {len(test_dataset)}")

    if len(train_dataset) == 0 or len(valid_dataset) == 0:
        raise RuntimeError("Train or validation split is empty — cannot train. "
                            "Check MIN_IMAGES_PER_CLASS and re-run dataset_audit.py split.")

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)
    valid_loader = DataLoader(valid_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)

    class_weights = compute_class_weights(train_dataset, num_classes, torch).to(device)
    print(f"[*] Class weights (imbalance correction): "
          f"{dict(zip(classes, [round(w, 3) for w in class_weights.cpu().tolist()]))}")

    model = build_model(args.arch, num_classes, torch, nn, models).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    best_val_acc = 0.0
    history = []
    ckpt_path = os.path.join(CHECKPOINT_DIR, f"{args.crop}_{args.arch}_best.pth")

    print(f"\n[*] Training for {args.epochs} epochs...")
    start_time = time.time()

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss, correct_train, total_train = 0.0, 0, 0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct_train += torch.sum(preds == labels).item()
            total_train += labels.size(0)
        scheduler.step()

        train_loss = running_loss / max(total_train, 1)
        train_acc = correct_train / max(total_train, 1)

        model.eval()
        val_loss, correct_val, total_val = 0.0, 0, 0
        with torch.no_grad():
            for images, labels in valid_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                correct_val += torch.sum(preds == labels).item()
                total_val += labels.size(0)
        val_loss = val_loss / max(total_val, 1)
        val_acc = correct_val / max(total_val, 1)

        print(f"Epoch [{epoch}/{args.epochs}] Train Loss {train_loss:.4f} Acc {train_acc*100:.2f}% | "
              f"Val Loss {val_loss:.4f} Acc {val_acc*100:.2f}%")
        history.append({"epoch": epoch, "train_loss": train_loss, "train_acc": train_acc,
                         "val_loss": val_loss, "val_acc": val_acc})

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            torch.save({"state_dict": model.state_dict(), "classes": classes, "arch": args.arch},
                       ckpt_path)

    duration = time.time() - start_time
    print(f"[+] Training complete in {duration:.1f}s. Best val acc: {best_val_acc*100:.2f}%. Checkpoint: {ckpt_path}")

    # ---- Test-set evaluation with full per-class metrics ----
    checkpoint = torch.load(ckpt_path, map_location=device)
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()

    all_preds, all_targets = [], []
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            probs = torch.softmax(model(images), dim=1)
            _, preds = torch.max(probs, 1)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_targets.extend(labels.numpy().tolist())

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)
    test_accuracy = float(np.mean(all_preds == all_targets)) if len(all_targets) else 0.0

    cm = np.zeros((num_classes, num_classes), dtype=int)
    for t, p in zip(all_targets, all_preds):
        cm[t, p] += 1

    per_class = {}
    f1s, precs, recs = [], [], []
    for idx, cls in enumerate(classes):
        tp = cm[idx, idx]
        fp = cm[:, idx].sum() - tp
        fn = cm[idx, :].sum() - tp
        prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        rec = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
        per_class[cls] = {"precision": prec, "recall": rec, "f1_score": f1, "support": int(cm[idx, :].sum())}
        f1s.append(f1); precs.append(prec); recs.append(rec)

    macro_f1 = float(np.mean(f1s)) if f1s else 0.0
    macro_prec = float(np.mean(precs)) if precs else 0.0
    macro_rec = float(np.mean(recs)) if recs else 0.0

    print(f"\n[+] TEST SET  Accuracy: {test_accuracy*100:.2f}%  "
          f"Macro-P: {macro_prec:.4f}  Macro-R: {macro_rec:.4f}  Macro-F1: {macro_f1:.4f}")

    eval_data = {
        "crop": args.crop,
        "architecture": args.arch,
        "epochs": args.epochs,
        "training_history": history,
        "best_val_accuracy": best_val_acc,
        "test_metrics": {"accuracy": test_accuracy, "macro_precision": macro_prec,
                          "macro_recall": macro_rec, "macro_f1": macro_f1},
        "per_class_metrics": per_class,
        "confusion_matrix": cm.tolist(),
        "classes": classes,
        "checkpoint_path": ckpt_path,
    }
    os.makedirs(REPORTS_DIR, exist_ok=True)
    eval_path = os.path.join(REPORTS_DIR, f"model_evaluation_{args.crop}.json")
    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump(eval_data, f, indent=2)
    print(f"[+] Evaluation report written: {eval_path}")
    print(f"[!] Next: python export_and_validate_onnx.py --crop {args.crop} --arch {args.arch}")


if __name__ == "__main__":
    main()
