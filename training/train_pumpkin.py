import os
import time
import json
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import onnx
import onnxruntime as ort
from onnxruntime.quantization import quantize_dynamic, QuantType

DATA_DIR = r"D:\krishi_marga_data\processed\pumpkin"
TRAIN_DIR = os.path.join(DATA_DIR, "train")
VAL_DIR = os.path.join(DATA_DIR, "val")
TEST_DIR = os.path.join(DATA_DIR, "test")

OUTPUT_DIR = r"training_output"
CANDIDATES_DIR = os.path.join(OUTPUT_DIR, "onnx_candidates", "pumpkin")
os.makedirs(CANDIDATES_DIR, exist_ok=True)
os.makedirs(os.path.join(OUTPUT_DIR, "checkpoints"), exist_ok=True)

# 1. Transforms adhering to Krishi Marga Mobile Inference Contract
train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.1, contrast=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

eval_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

train_ds = datasets.ImageFolder(TRAIN_DIR, transform=train_transform)
val_ds = datasets.ImageFolder(VAL_DIR, transform=eval_transform)
test_ds = datasets.ImageFolder(TEST_DIR, transform=eval_transform)

class_names = train_ds.classes
num_classes = len(class_names)
print(f"[*] Detected {num_classes} classes: {class_names}")
print(f"[*] Train: {len(train_ds)}, Val: {len(val_ds)}, Test: {len(test_ds)}")

train_loader = DataLoader(train_ds, batch_size=32, shuffle=True, num_workers=0)
val_loader = DataLoader(val_ds, batch_size=32, shuffle=False, num_workers=0)
test_loader = DataLoader(test_ds, batch_size=32, shuffle=False, num_workers=0)

# 2. Build MobileNetV3-Small
device = torch.device("cpu")
print("[*] Building MobileNetV3-Small architecture...")
model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)

# Freeze lower feature extractor layers for fast, stable CPU training
for param in model.features[:9].parameters():
    param.requires_grad = False

in_features = model.classifier[3].in_features
model.classifier[3] = nn.Linear(in_features, num_classes)
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3, weight_decay=1e-4)

# 3. Training Loop (3 epochs for fast CPU convergence with pre-trained features)
EPOCHS = 3
best_val_acc = 0.0
best_model_path = os.path.join(OUTPUT_DIR, "checkpoints", "pumpkin_best.pth")

print("\n[*] Starting training on CPU...")
for epoch in range(EPOCHS):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    t0 = time.time()
    
    for batch_idx, (images, labels) in enumerate(train_loader):
        images, labels = images.to(device), labels.to_device(device) if hasattr(labels, 'to_device') else labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += torch.sum(preds == labels.data).item()
        total += labels.size(0)
        
        if (batch_idx + 1) % 15 == 0 or (batch_idx + 1) == len(train_loader):
            print(f"  Epoch {epoch+1}/{EPOCHS} [Batch {batch_idx+1}/{len(train_loader)}] Loss: {loss.item():.4f}")
            
    train_loss = running_loss / total
    train_acc = correct / total
    
    # Validation
    model.eval()
    val_correct = 0
    val_total = 0
    val_loss = 0.0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            val_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            val_correct += torch.sum(preds == labels.data).item()
            val_total += labels.size(0)
            
    val_acc = val_correct / val_total
    val_loss = val_loss / val_total
    dt = time.time() - t0
    print(f"[*] Epoch {epoch+1} ({dt:.1f}s) - Train Acc: {train_acc*100:.2f}%, Val Acc: {val_acc*100:.2f}%, Val Loss: {val_loss:.4f}")
    
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save(model.state_dict(), best_model_path)

# Load best checkpoint
model.load_state_dict(torch.load(best_model_path))
model.eval()

# 4. Out-of-Sample Test Evaluation
test_correct = 0
test_total = 0
with torch.no_grad():
    for images, labels in test_loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        _, preds = torch.max(outputs, 1)
        test_correct += torch.sum(preds == labels.data).item()
        test_total += labels.size(0)

test_acc = test_correct / test_total
print(f"\n[+] Final Out-of-Sample Test Accuracy: {test_acc*100:.2f}% ({test_correct}/{test_total})")

# 5. Export FP32 ONNX
fp32_onnx_path = os.path.join(CANDIDATES_DIR, "disease_fp32.onnx")
dummy_input = torch.randn(1, 3, 224, 224, device=device)

# Set model to produce softmax probabilities directly as required by inference contract
class ModelWithSoftmax(nn.Module):
    def __init__(self, base):
        super().__init__()
        self.base = base
        self.softmax = nn.Softmax(dim=1)
    def forward(self, x):
        return self.softmax(self.base(x))

export_model = ModelWithSoftmax(model)
export_model.eval()

torch.onnx.export(
    export_model,
    dummy_input,
    fp32_onnx_path,
    input_names=["input_image"],
    output_names=["probabilities"],
    opset_version=14,
    do_constant_folding=True
)
print(f"[+] Exported FP32 ONNX to {fp32_onnx_path}")

# 6. Validate FP32 ONNX with ONNX Runtime
session_fp32 = ort.InferenceSession(fp32_onnx_path, providers=['CPUExecutionProvider'])
dummy_np = np.random.randn(1, 3, 224, 224).astype(np.float32)
out_fp32 = session_fp32.run(["probabilities"], {"input_image": dummy_np})[0]
assert out_fp32.shape == (1, num_classes), f"Shape mismatch: {out_fp32.shape}"
assert np.isclose(np.sum(out_fp32), 1.0, atol=1e-3), "Softmax probabilities do not sum to 1"
print("[+] FP32 ONNX Runtime validation passed!")

# 7. INT8 Dynamic Quantization
int8_onnx_path = os.path.join(CANDIDATES_DIR, "disease_int8.onnx")
quantize_dynamic(
    model_input=fp32_onnx_path,
    model_output=int8_onnx_path,
    weight_type=QuantType.QUInt8
)
print(f"[+] Quantized INT8 ONNX to {int8_onnx_path}")

# 8. Validate INT8 ONNX with ONNX Runtime
session_int8 = ort.InferenceSession(int8_onnx_path, providers=['CPUExecutionProvider'])
out_int8 = session_int8.run(["probabilities"], {"input_image": dummy_np})[0]
assert out_int8.shape == (1, num_classes), f"INT8 Shape mismatch: {out_int8.shape}"
print("[+] INT8 ONNX Runtime validation passed!")

# 9. Evaluate Both Models on the Clean Test Split via ONNX Runtime
print("\n[*] Evaluating FP32 vs INT8 test accuracy via ONNX Runtime...")
fp32_correct = 0
int8_correct = 0

for images, labels in test_loader:
    imgs_np = images.numpy()
    lbls_np = labels.numpy()
    
    # Run batch through FP32
    for i in range(imgs_np.shape[0]):
        single_input = imgs_np[i:i+1]
        target = lbls_np[i]
        
        pred_fp32 = np.argmax(session_fp32.run(["probabilities"], {"input_image": single_input})[0])
        if pred_fp32 == target:
            fp32_correct += 1
            
        pred_int8 = np.argmax(session_int8.run(["probabilities"], {"input_image": single_input})[0])
        if pred_int8 == target:
            int8_correct += 1

total_test = len(test_ds)
fp32_test_acc = fp32_correct / total_test
int8_test_acc = int8_correct / total_test

fp32_size_mb = os.path.getsize(fp32_onnx_path) / (1024 * 1024)
int8_size_mb = os.path.getsize(int8_onnx_path) / (1024 * 1024)

print(f"  FP32 Model Size: {fp32_size_mb:.2f} MB | Test Accuracy: {fp32_test_acc*100:.2f}%")
print(f"  INT8 Model Size: {int8_size_mb:.2f} MB | Test Accuracy: {int8_test_acc*100:.2f}%")

# Select smallest model that meets technical requirements
if int8_test_acc >= fp32_test_acc - 0.03:
    chosen_path = int8_onnx_path
    chosen_acc = int8_test_acc
    chosen_size = int8_size_mb
    chosen_type = "INT8"
else:
    chosen_path = fp32_onnx_path
    chosen_acc = fp32_test_acc
    chosen_size = fp32_size_mb
    chosen_type = "FP32"

print(f"[+] Selected model: {chosen_type} ({chosen_size:.2f} MB, {chosen_acc*100:.2f}% acc)")

# Save final production candidate
prod_onnx_path = os.path.join(CANDIDATES_DIR, "disease.onnx")
import shutil
shutil.copy2(chosen_path, prod_onnx_path)

# Write classes.json
display_classes = [c.replace('_', ' ').title() for c in class_names]
classes_json_path = os.path.join(CANDIDATES_DIR, "classes.json")
with open(classes_json_path, 'w', encoding='utf-8') as f:
    json.dump(display_classes, f, indent=2)

metrics_report = {
    "crop": "pumpkin",
    "dataset_id": "tahmidmir/pumpkin-leaf-diseases-dataset-from-bangladesh",
    "license": "CC BY 4.0",
    "architecture": "MobileNetV3-Small",
    "classes": display_classes,
    "num_classes": num_classes,
    "raw_images": 2000,
    "usable_images": 1999,
    "train_images": len(train_ds),
    "val_images": len(val_ds),
    "test_images": len(test_ds),
    "fp32_size_mb": round(fp32_size_mb, 2),
    "fp32_test_accuracy": round(fp32_test_acc * 100, 2),
    "int8_size_mb": round(int8_size_mb, 2),
    "int8_test_accuracy": round(int8_test_acc * 100, 2),
    "selected_model_type": chosen_type,
    "selected_model_size_mb": round(chosen_size, 2),
    "selected_model_test_accuracy": round(chosen_acc * 100, 2),
    "final_onnx_path": prod_onnx_path
}

with open(os.path.join(CANDIDATES_DIR, "training_metrics.json"), 'w', encoding='utf-8') as f:
    json.dump(metrics_report, f, indent=2)

with open('reports/pumpkin_training_results.json', 'w', encoding='utf-8') as f:
    json.dump(metrics_report, f, indent=2)

print("\n=== PUMPKIN TRAINING & ONNX EXPORT COMPLETE ===")
print(json.dumps(metrics_report, indent=2))
