"""
Krishi Marga — Model Training Engine
Trains lightweight MobileNetV3-Small architecture for mobile ONNX deployment.
Auto-detects GPU (CUDA) or falls back to CPU.
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

def train_model(data_dir=None, epochs=15, batch_size=32, lr=0.001,
                arch='mobilenet_v3_small', seed=42):
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

    # 1. Device selection
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print("=" * 65)
    print("         KRISHI MARGA — ONNX MODEL TRAINING PIPELINE         ")
    print("=" * 65)
    print(f"Device Selected  : {device.type.upper()}" + (f" ({torch.cuda.get_device_name(0)})" if device.type == 'cuda' else " (Running on CPU)"))
    print(f"Architecture     : {arch} (Mobile-Optimized)")
    print(f"Epochs           : {epochs}")
    print(f"Batch Size       : {batch_size}")
    print(f"Learning Rate    : {lr}")
    print("-" * 65)

    base_dir = Path(__file__).parent.parent
    if data_dir is None:
        data_dir = base_dir / "dataset" / "processed"
    else:
        data_dir = Path(data_dir).resolve()

    train_dir = data_dir / "train"
    val_dir = data_dir / "val"

    if not train_dir.exists() or not val_dir.exists():
        print(f"[ERROR] Processed train/val folders not found at: {data_dir}")
        print("Please run prepare_dataset.py first!")
        sys.exit(1)

    # 2. Data Transforms matching Krishi Marga mobile TENSOR_SPEC exactly
    # input: [1, 3, 224, 224], mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
    norm_mean = [0.485, 0.456, 0.406]
    norm_std = [0.229, 0.224, 0.225]

    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(norm_mean, norm_std)
    ])

    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(norm_mean, norm_std)
    ])

    train_dataset = datasets.ImageFolder(str(train_dir), transform=train_transform)
    val_dataset = datasets.ImageFolder(str(val_dir), transform=val_transform)

    num_classes = len(train_dataset.classes)
    print(f"[DATASET] Loaded {len(train_dataset)} training images across {num_classes} classes.")
    print(f"[DATASET] Loaded {len(val_dataset)} validation images.")

    # Save class mapping
    class_to_idx = train_dataset.class_to_idx
    idx_to_class = {str(v): k for k, v in class_to_idx.items()}
    out_dir = base_dir / "outputs"
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / "class_names.json", "w", encoding="utf-8") as f:
        json.dump(idx_to_class, f, indent=2)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2, pin_memory=(device.type == 'cuda'))
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=(device.type == 'cuda'))

    # 3. Model instantiation
    if arch == 'mobilenet_v3_small':
        model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(in_features, num_classes)
    elif arch == 'mobilenet_v2':
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, num_classes)
    else:
        print(f"[ERROR] Unsupported architecture: {arch}")
        sys.exit(1)

    model = model.to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    checkpoints_dir = base_dir / "models" / "checkpoints"
    checkpoints_dir.mkdir(parents=True, exist_ok=True)
    best_checkpoint_path = checkpoints_dir / "best_model.pth"

    best_val_acc = 0.0
    history = []
    patience = 4
    no_improve_epochs = 0

    print("\n[TRAINING] Commencing training loop...")
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct_train += torch.sum(preds == labels.data).item()
            total_train += labels.size(0)

        scheduler.step()
        train_loss = running_loss / total_train
        train_acc = correct_train / total_train

        # Validation phase
        model.eval()
        val_loss = 0.0
        correct_val = 0
        total_val = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                correct_val += torch.sum(preds == labels.data).item()
                total_val += labels.size(0)

        val_loss = val_loss / total_val
        val_acc = correct_val / total_val
        epoch_time = time.time() - epoch_start

        history.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc * 100, 2),
            "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc * 100, 2),
            "time_sec": round(epoch_time, 1)
        })

        is_best = val_acc > best_val_acc
        status_marker = " [★ BEST]" if is_best else ""
        print(f"Epoch [{epoch:02d}/{epochs:02d}] ({epoch_time:.1f}s) — Train Acc: {train_acc*100:.2f}%, Loss: {train_loss:.4f} | Val Acc: {val_acc*100:.2f}%, Loss: {val_loss:.4f}{status_marker}")

        if is_best:
            best_val_acc = val_acc
            no_improve_epochs = 0
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc,
                'num_classes': num_classes,
                'arch': arch,
                'class_names': idx_to_class
            }, best_checkpoint_path)
        else:
            no_improve_epochs += 1
            if no_improve_epochs >= patience:
                print(f"\n[EARLY STOPPING] Validation accuracy did not improve for {patience} epochs. Stopping.")
                break

    total_training_time = time.time() - start_time
    print("-" * 65)
    print(f"Training Complete in {total_training_time/60:.1f} minutes.")
    print(f"Best Validation Accuracy: {best_val_acc * 100:.2f}%")
    print(f"Checkpoint saved to: {best_checkpoint_path}")

    # Save training report
    report = {
        "architecture": arch,
        "num_classes": num_classes,
        "epochs_trained": len(history),
        "best_val_accuracy": round(best_val_acc * 100, 2),
        "total_time_seconds": round(total_training_time, 1),
        "device": device.type,
        "history": history
    }
    with open(out_dir / "training_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"Training report saved to: {out_dir / 'training_report.json'}")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train plant disease classification model")
    parser.add_argument("--data", type=str, default=None, help="Path to processed dataset")
    parser.add_argument("--arch", type=str, default="mobilenet_v3_small", choices=["mobilenet_v3_small", "mobilenet_v2"])
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=0.001)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    train_model(
        data_dir=args.data,
        arch=args.arch,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        seed=args.seed
    )
