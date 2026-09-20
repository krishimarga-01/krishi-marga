"""
Krishi Marga — Model Evaluation Utility
Evaluates checkpoint on held-out test set, computes precision, recall, F1,
and saves confusion matrix.
"""

import os
import sys
import json
import argparse
from pathlib import Path

import torch
import numpy as np
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from sklearn.metrics import classification_report, confusion_matrix

def evaluate_model(checkpoint_path=None, test_dir=None):
    base_dir = Path(__file__).parent.parent
    if checkpoint_path is None:
        checkpoint_path = base_dir / "models" / "checkpoints" / "best_model.pth"
    else:
        checkpoint_path = Path(checkpoint_path).resolve()

    if not checkpoint_path.exists():
        print(f"[ERROR] Checkpoint not found: {checkpoint_path}")
        sys.exit(1)

    if test_dir is None:
        test_dir = base_dir / "dataset" / "processed" / "test"
    else:
        test_dir = Path(test_dir).resolve()

    if not test_dir.exists():
        print(f"[ERROR] Test directory not found: {test_dir}")
        sys.exit(1)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print("=" * 65)
    print("       KRISHI MARGA — HELD-OUT TEST EVALUATION REPORT        ")
    print("=" * 65)
    print(f"Loading checkpoint: {checkpoint_path.name}")
    checkpoint = torch.load(checkpoint_path, map_location=device)

    num_classes = checkpoint['num_classes']
    arch = checkpoint.get('arch', 'mobilenet_v3_small')
    class_names = checkpoint.get('class_names', {})

    norm_mean = [0.485, 0.456, 0.406]
    norm_std = [0.229, 0.224, 0.225]

    test_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(norm_mean, norm_std)
    ])

    test_dataset = datasets.ImageFolder(str(test_dir), transform=test_transform)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False, num_workers=2)

    # Reconstruct model
    if arch == 'mobilenet_v3_small':
        model = models.mobilenet_v3_small(weights=None)
        in_features = model.classifier[3].in_features
        model.classifier[3] = torch.nn.Linear(in_features, num_classes)
    elif arch == 'mobilenet_v2':
        model = models.mobilenet_v2(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier[1] = torch.nn.Linear(in_features, num_classes)

    model.load_state_dict(checkpoint['model_state_dict'])
    model = model.to(device)
    model.eval()

    all_preds = []
    all_targets = []

    print(f"[EVALUATION] Running inference on {len(test_dataset)} held-out test images...")
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(labels.numpy())

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)

    test_acc = np.mean(all_preds == all_targets) * 100
    target_names = [class_names.get(str(i), test_dataset.classes[i]) for i in range(num_classes)]

    report_dict = classification_report(all_targets, all_preds, target_names=target_names, output_dict=True, zero_division=0)
    print("\n" + "-" * 65)
    print(f"  HELD-OUT TEST ACCURACY : {test_acc:.2f}%")
    print(f"  MACRO AVERAGE PRECISION: {report_dict['macro avg']['precision'] * 100:.2f}%")
    print(f"  MACRO AVERAGE RECALL   : {report_dict['macro avg']['recall'] * 100:.2f}%")
    print(f"  MACRO AVERAGE F1-SCORE : {report_dict['macro avg']['f1-score'] * 100:.2f}%")
    print("-" * 65)

    print("\nCLASS-WISE PERFORMANCE:")
    for idx, name in enumerate(target_names):
        m = report_dict.get(name, {})
        print(f"  [{idx:02d}] {name:38s} | Prec: {m.get('precision', 0)*100:5.1f}% | Rec: {m.get('recall', 0)*100:5.1f}% | F1: {m.get('f1-score', 0)*100:5.1f}% (N={m.get('support', 0)})")

    # Confusion Matrix
    cm = confusion_matrix(all_targets, all_preds)

    out_dir = base_dir / "outputs"
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        import matplotlib.pyplot as plt
        import seaborn as sns
        plt.figure(figsize=(max(8, num_classes * 0.5), max(6, num_classes * 0.4)))
        sns.heatmap(cm, annot=(num_classes <= 20), fmt='d', cmap='Blues',
                    xticklabels=target_names, yticklabels=target_names)
        plt.title(f'Test Confusion Matrix (Acc: {test_acc:.2f}%)')
        plt.ylabel('Actual Label')
        plt.xlabel('Predicted Label')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        cm_path = out_dir / "confusion_matrix" / "confusion_matrix.png"
        cm_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(cm_path, dpi=200)
        plt.close()
        print(f"\n[SAVED] Confusion matrix image saved to: {cm_path}")
    except Exception as e:
        print(f"\n[NOTE] Matplotlib/Seaborn visualization skipped: {e}")

    eval_report = {
        "test_accuracy": round(test_acc, 2),
        "macro_precision": round(report_dict['macro avg']['precision'] * 100, 2),
        "macro_recall": round(report_dict['macro avg']['recall'] * 100, 2),
        "macro_f1": round(report_dict['macro avg']['f1-score'] * 100, 2),
        "num_test_samples": len(test_dataset),
        "class_metrics": {name: report_dict[name] for name in target_names if name in report_dict}
    }
    with open(out_dir / "evaluation_report.json", "w", encoding="utf-8") as f:
        json.dump(eval_report, f, indent=2)

    print(f"[SAVED] Evaluation metrics saved to: {out_dir / 'evaluation_report.json'}")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate model on test set")
    parser.add_argument("--checkpoint", type=str, default=None, help="Path to .pth checkpoint")
    parser.add_argument("--test-dir", type=str, default=None, help="Path to test split directory")
    args = parser.parse_args()
    evaluate_model(args.checkpoint, args.test_dir)
